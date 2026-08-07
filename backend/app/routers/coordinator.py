from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.agents.coordinator_agent import CoordinatorAgent, CoordinatorAgentError
from app.models.cost import TransferContext, TransferWithCost
from app.models.transfer import SurplusDeficit, TransferProposal
from app.routers import ApiError
from app.services.cost_engine import CostEngine
from app.utils.logger import get_logger


logger = get_logger(__name__)

agents_router = APIRouter(prefix="/agents", tags=["agents"])
cost_router = APIRouter(prefix="/cost", tags=["cost"])


def get_coordinator_agent() -> CoordinatorAgent:
    return CoordinatorAgent()


def get_cost_engine() -> CostEngine:
    return CostEngine()


@agents_router.post(
    "/coordinate",
    response_model=list[TransferProposal],
    status_code=status.HTTP_200_OK,
    summary="Coordinate regional outputs into transfer proposals",
)
def coordinate_transfers(
    regional_outputs: dict[str, list[SurplusDeficit]],
    coordinator_agent: Annotated[CoordinatorAgent, Depends(get_coordinator_agent)],
) -> list[TransferProposal]:
    try:
        logger.info("Running coordinator agent for %s store(s).", len(regional_outputs))
        return coordinator_agent.coordinate(regional_outputs)
    except CoordinatorAgentError as exc:
        logger.exception("Coordinator agent failed.")
        raise ApiError(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected coordinator agent failure.")
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Coordinator agent request failed.",
        ) from exc


@cost_router.post(
    "/calculate",
    response_model=list[TransferWithCost],
    status_code=status.HTTP_200_OK,
    summary="Calculate deterministic transfer costs",
)
def calculate_costs(
    contexts: list[TransferContext],
    cost_engine: Annotated[CostEngine, Depends(get_cost_engine)],
) -> list[TransferWithCost]:
    try:
        logger.info("Calculating costs for %s transfer context(s).", len(contexts))
        return cost_engine.calculate_all(contexts)
    except Exception as exc:
        logger.exception("Cost calculation failed.")
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Cost calculation request failed.",
        ) from exc
