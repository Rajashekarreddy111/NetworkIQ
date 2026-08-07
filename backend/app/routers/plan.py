from __future__ import annotations

from typing import Annotated, Protocol

from fastapi import APIRouter, Body, Depends, Path, status
from pydantic import BaseModel, ConfigDict

from app.models.response import SelfCheckResult, ValidatedTransfer
from app.routers import ApiError
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
) -> ValidatedTransfer:
    logger.info("Approving validated transfer id %s.", id)
    return plan_repository.approve(id)


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
) -> ValidatedTransfer:
    logger.info("Overriding validated transfer id %s.", id)
    return plan_repository.override(id, transfer)
