from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.services.analytics_service import AnalyticsResponse, AnalyticsService


router = APIRouter(tags=["analytics"])


def get_analytics_service() -> AnalyticsService:
    return AnalyticsService()


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get analytics trends, velocity distributions, and mover metrics",
)
def get_analytics(
    service: Annotated[AnalyticsService, Depends(get_analytics_service)],
) -> AnalyticsResponse:
    """Return analytics metrics calculated from master inventory data."""
    return service.get_analytics()
