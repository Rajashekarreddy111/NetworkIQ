from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.agents.regional_agent import RegionalAgent, RegionalAgentError
from app.models.inventory import InventoryPosition
from app.models.transfer import SurplusDeficit
from app.routers import ApiError
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/agents", tags=["agents"])


def get_regional_agent() -> RegionalAgent:
    return RegionalAgent()


@router.post(
    "/regional/{store}",
    response_model=list[SurplusDeficit],
    status_code=status.HTTP_200_OK,
    summary="Run the store-wise regional agent",
)
def analyze_store_inventory(
    store: str,
    inventory_positions: list[InventoryPosition],
    regional_agent: Annotated[RegionalAgent, Depends(get_regional_agent)],
) -> list[SurplusDeficit]:
    mismatched_locations = {
        inventory_position.location
        for inventory_position in inventory_positions
        if inventory_position.location != store
    }
    if mismatched_locations:
        raise ApiError(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request body contains locations that do not match store '{store}': {sorted(mismatched_locations)}",
        )

    try:
        logger.info("Running regional agent for store %s.", store)
        return regional_agent.analyze_store(inventory_positions)
    except RegionalAgentError as exc:
        logger.exception("Regional agent failed for store %s.", store)
        raise ApiError(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Unexpected regional agent failure for store %s.", store)
        raise ApiError(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Regional agent request failed.",
        ) from exc
