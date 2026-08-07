from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict, Field

from app.config import settings


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str = "ok"
    application: str = settings.APP_NAME
    version: str = settings.APP_VERSION
    environment: str = settings.ENVIRONMENT
    gemini_status: str = "configured" if settings.GEMINI_API_KEY else "unconfigured"
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = ConfigDict(extra="forbid")


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
)
def get_health() -> HealthResponse:
    """Return application status, Gemini status, version, environment, and timestamp."""
    return HealthResponse()
