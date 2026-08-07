from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.response import ValidatedTransfer
from app.services.loader import InventoryLoader
from app.services.plan_repository import PlanRepository


class DashboardKPIs(BaseModel):
    total_skus: int
    total_locations: int
    total_stock_units: int
    active_recommendations: int
    approved_transfers: int
    margin_unlocked_total: float
    estimated_holding_cost: float

    model_config = ConfigDict(extra="forbid")


class DashboardResponse(BaseModel):
    kpis: DashboardKPIs
    agent_status: dict[str, str]
    recent_transfers: list[ValidatedTransfer]
    recommendations_count: int

    model_config = ConfigDict(extra="forbid")


class DashboardService:
    """Service that aggregates dashboard metrics from inventory loader and plan repository."""

    def __init__(
        self,
        loader: InventoryLoader | None = None,
        repository: PlanRepository | None = None,
    ) -> None:
        self._loader = loader or InventoryLoader()
        self._repository = repository or PlanRepository()

    def get_dashboard_summary() -> DashboardResponse:
        """Calculate and return high-level dashboard metrics."""
        inventory_by_store = self._loader.load()
        latest_plan = self._repository.get_latest_plan()

        total_skus = sum(len(positions) for positions in inventory_by_store.values())
        total_locations = len(inventory_by_store)
        total_stock = sum(
            pos.current_stock
            for positions in inventory_by_store.values()
            for pos in positions
        )

        approved = [t for t in latest_plan if t.status == "approved"]
        margin_unlocked = sum(t.margin_unlocked for t in approved)
        holding_cost = sum(pos.current_stock * 1.5 for positions in inventory_by_store.values() for pos in positions)

        kpis = DashboardKPIs(
            total_skus=total_skus,
            total_locations=total_locations,
            total_stock_units=total_stock,
            active_recommendations=len(latest_plan),
            approved_transfers=len(approved),
            margin_unlocked_total=round(margin_unlocked, 2),
            estimated_holding_cost=round(holding_cost, 2),
        )

        agent_status = {
            "RegionalAgent": "active",
            "CoordinatorAgent": "active",
            "CostEngine": "active",
            "GuardrailValidator": "active",
            "SelfCheckAgent": "active",
        }

        return DashboardResponse(
            kpis=kpis,
            agent_status=agent_status,
            recent_transfers=latest_plan[:5],
            recommendations_count=len(latest_plan),
        )
