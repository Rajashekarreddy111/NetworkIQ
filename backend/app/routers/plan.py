from __future__ import annotations

from typing import Annotated, Protocol

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import BaseModel, ConfigDict

from app.models.response import SelfCheckResult, ValidatedTransfer
from app.routers import ApiError
from app.services.audit_service import AuditService, get_audit_service
from app.services.plan_repository import PlanRepository, get_plan_repository
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(tags=["plan"])
selfcheck_router = APIRouter(tags=["self-check"])


class SelfCheckAgentProtocol(Protocol):
    def review_plan(self, validated_transfers: list[ValidatedTransfer]) -> SelfCheckResult:
        """Review a validated plan and return a self-check result."""


class SelfCheckPendingResponse(BaseModel):
    status: str
    message: str

    model_config = ConfigDict(extra="forbid")


class PlannerDecisionPayload(BaseModel):
    id: str
    decision: str
    note: str | None = None
    quantity: int | None = None

    model_config = ConfigDict(extra="forbid")


def get_self_check_agent() -> SelfCheckAgentProtocol | None:
    try:
        from app.agents.selfcheck_agent import SelfCheckAgent
    except ImportError:
        logger.warning("SelfCheckAgent is unavailable; returning pending self-check response.")
        return None

    try:
        return SelfCheckAgent()
    except Exception as exc:
        logger.exception("Failed to initialize SelfCheckAgent.")
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SelfCheckAgent initialization failed.",
        ) from exc


@selfcheck_router.post(
    "/selfcheck",
    response_model=SelfCheckResult | SelfCheckPendingResponse,
    status_code=status.HTTP_200_OK,
    summary="Run the self-check agent against a validated transfer plan",
)
def self_check_plan(
    validated_transfers: list[ValidatedTransfer],
    self_check_agent: Annotated[SelfCheckAgentProtocol | None, Depends(get_self_check_agent)],
) -> SelfCheckResult | SelfCheckPendingResponse:
    if self_check_agent is None:
        return SelfCheckPendingResponse(
            status="pending",
            message="Self Check Agent is currently disabled.",
        )

    try:
        logger.info("Running self-check agent for %s validated transfer(s).", len(validated_transfers))
        return self_check_agent.review_plan(validated_transfers)
    except ApiError:
        raise
    except AttributeError:
        logger.warning("SelfCheckAgent does not expose review_plan; returning pending self-check response.")
        return SelfCheckPendingResponse(
            status="pending",
            message="Self Check Agent is currently disabled.",
        )
    except Exception as exc:
        logger.exception("Self-check agent failed.")
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Self-check request failed.",
        ) from exc


@selfcheck_router.get(
    "/self-check",
    response_model=SelfCheckResult | SelfCheckPendingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get latest self-check agent status and evaluation",
)
@router.get(
    "/plan/self-check",
    response_model=SelfCheckResult | SelfCheckPendingResponse,
    status_code=status.HTTP_200_OK,
    summary="Get latest self-check agent status and evaluation for plan",
)
def get_self_check(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    self_check_agent: Annotated[SelfCheckAgentProtocol | None, Depends(get_self_check_agent)],
) -> SelfCheckResult | SelfCheckPendingResponse:
    latest_plan = plan_repository.get_latest_plan()
    if self_check_agent is None or not latest_plan:
        return SelfCheckPendingResponse(
            status="pending",
            message="No self-check result available.",
        )
    return self_check_agent.review_plan(latest_plan)


@router.get(
    "/plan",
    response_model=list[ValidatedTransfer],
    status_code=status.HTTP_200_OK,
    summary="Return the latest validated plan",
)
def get_latest_plan(
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
) -> list[ValidatedTransfer]:
    logger.info("Returning latest validated plan.")
    return plan_repository.get_latest_plan()


@router.post(
    "/plan/{id}/approve",
    response_model=ValidatedTransfer,
    status_code=status.HTTP_200_OK,
    summary="Approve a transfer in the latest validated plan",
)
def approve_transfer(
    id: Annotated[str, Path(description="Stable transfer identifier in the latest validated plan.")],
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    audit_service: Annotated[AuditService, Depends(get_audit_service)],
) -> ValidatedTransfer:
    logger.info("Approving validated transfer id %s.", id)
    approved = plan_repository.approve(id)
    audit_service.record("APPROVE", approved.sku, approved.from_location, f"Transfer approved for qty {approved.qty}")
    return approved


@router.post(
    "/plan/{id}/override",
    response_model=ValidatedTransfer,
    status_code=status.HTTP_200_OK,
    summary="Override a transfer in the latest validated plan",
)
def override_transfer(
    id: Annotated[str, Path(description="Stable transfer identifier in the latest validated plan.")],
    transfer: Annotated[ValidatedTransfer, Body()],
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    audit_service: Annotated[AuditService, Depends(get_audit_service)],
) -> ValidatedTransfer:
    logger.info("Overriding validated transfer id %s.", id)
    overridden = plan_repository.override(id, transfer)
    audit_service.record("OVERRIDE", overridden.sku, overridden.from_location, f"Transfer overridden for qty {overridden.qty}")
    return overridden


from datetime import datetime, timezone
from app.storage.json_store import json_store


@router.post(
    "/plan/decision",
    response_model=PlannerDecisionPayload,
    status_code=status.HTTP_200_OK,
    summary="Submit planner decision (Approve, Reject, Override) for a transfer recommendation",
)
def submit_planner_decision(
    payload: Annotated[PlannerDecisionPayload, Body()],
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
    audit_service: Annotated[AuditService, Depends(get_audit_service)],
) -> PlannerDecisionPayload:
    logger.info("Processing planner decision %s for transfer id %s.", payload.decision, payload.id)
    decision_type = payload.decision.lower()

    now_iso = datetime.now(timezone.utc).isoformat()
    decision_record = {
        "id": payload.id,
        "decision": payload.decision,
        "note": payload.note,
        "quantity": payload.quantity,
        "timestamp": now_iso,
    }
    json_store.append("planner_decisions", decision_record)

    if decision_type == "approve":
        transfer = plan_repository.approve(payload.id)
        audit_service.record("APPROVE", transfer.sku, transfer.from_location, payload.note or "Approved by planner")
    else:
        audit_service.record(
            decision_type.upper(),
            "TRANSFER",
            "PLANNER",
            payload.note or f"Planner decision {payload.decision} recorded for transfer {payload.id}",
        )

    return payload
