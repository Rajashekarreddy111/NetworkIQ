from __future__ import annotations

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict

from app.config import settings


router = APIRouter(tags=["config"])


class NotificationConfig(BaseModel):
    email: bool = True
    slack: bool = True
    digest: bool = False
    criticalOnly: bool = False

    model_config = ConfigDict(extra="forbid")


class SystemConfigResponse(BaseModel):
    apiUrl: str = f"http://{settings.HOST}:{settings.PORT}"
    signoff_value_threshold: float = 50000.0
    holding_cost_threshold: float = 10000.0
    autoApprove: bool = True
    budgetEnvelope: float = 18000000.0
    plannerThreshold: float = settings.APPROVAL_THRESHOLD
    default_holding_cost_rate: float = settings.DEFAULT_HOLDING_COST_RATE
    default_lead_time_days: int = settings.DEFAULT_LEAD_TIME_DAYS
    supported_locations: list[str] = settings.SUPPORTED_REGIONS
    notifications: NotificationConfig = NotificationConfig()

    model_config = ConfigDict(extra="forbid")


@router.get(
    "/config",
    response_model=SystemConfigResponse,
    status_code=status.HTTP_200_OK,
    summary="Get system configuration and guardrail parameters",
)
def get_system_config() -> SystemConfigResponse:
    """Return backend threshold configurations, guardrail settings, and location definitions."""
    return SystemConfigResponse()
