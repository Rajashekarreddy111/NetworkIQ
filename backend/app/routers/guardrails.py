from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, ConfigDict

from app.guardrails.validator import GuardrailValidationError, ValidationEngine
from app.models.cost import TransferWithCost
from app.models.guardrail import GuardrailContext
from app.models.response import ValidatedTransfer
from app.routers import ApiError
from app.services.plan_repository import PlanRepository, get_plan_repository
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/guardrails", tags=["guardrails"])


class GuardrailValidationItem(BaseModel):
    transfer: TransferWithCost
    context: GuardrailContext

    model_config = ConfigDict(extra="forbid")


class StaticGuardrailContextProvider:
    def __init__(self, context: GuardrailContext) -> None:
        self._context = context

    def get_context(self, transfer: TransferWithCost) -> GuardrailContext:
        return self._context


@router.post(
    "/validate",
    response_model=list[ValidatedTransfer],
    status_code=status.HTTP_200_OK,
    summary="Validate costed transfers with deterministic guardrails",
)
def validate_transfers(
    items: list[GuardrailValidationItem],
    plan_repository: Annotated[PlanRepository, Depends(get_plan_repository)],
) -> list[ValidatedTransfer]:
    validated_transfers: list[ValidatedTransfer] = []

    try:
        logger.info("Validating %s costed transfer(s).", len(items))
        for item in items:
            engine = ValidationEngine(StaticGuardrailContextProvider(item.context))
            validated_transfers.append(engine.validate_transfer(item.transfer))
        plan_repository.replace_latest_plan(validated_transfers)
        return validated_transfers
    except GuardrailValidationError as exc:
        logger.exception("Guardrail validation failed.")
        raise ApiError(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected guardrail validation failure.")
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Guardrail validation request failed.",
        ) from exc
