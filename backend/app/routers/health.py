from __future__ import annotations

from fastapi import APIRouter, status
from pydantic import BaseModel, ConfigDict


router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"

    model_config = ConfigDict(extra="forbid")


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check endpoint",
)
def get_health() -> HealthResponse:
    """Return current service health status."""
    return HealthResponse()
