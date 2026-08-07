from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.services.dashboard_service import DashboardResponse, DashboardService


router = APIRouter(tags=["dashboard"])


def get_dashboard_service() -> DashboardService:
    return DashboardService()


@router.get(
    "/dashboard",
    response_model=DashboardResponse,
    status_code=status.HTTP_200_OK,
    summary="Get dashboard KPIs, summary statistics, and active agent statuses",
)
def get_dashboard(
    service: Annotated[DashboardService, Depends(get_dashboard_service)],
) -> DashboardResponse:
    """Return dashboard summary metrics."""
    return service.get_dashboard_summary()
