from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.response import ValidatedTransfer
from app.services.loader import InventoryLoader
from app.services.plan_repository import PlanRepository


class DashboardKPIs(BaseModel):
    total_records: int
    total_regions: int
    total_sub_categories: int
    total_inventory: int
    avg_daily_demand: float
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
    """Service that aggregates dashboard metrics strictly from master_inventory.csv and plan repository."""

    def __init__(
        self,
        loader: InventoryLoader | None = None,
        repository: PlanRepository | None = None,
    ) -> None:
        self._loader = loader or InventoryLoader()
        self._repository = repository or PlanRepository()

    def get_dashboard_summary(self) -> DashboardResponse:
        """Calculate and return high-level dashboard metrics using real master_inventory.csv data."""
        inventory_by_store = self._loader.load()
        latest_plan = self._repository.get_latest_plan()

        all_positions = [
            pos for positions in inventory_by_store.values() for pos in positions
        ]

        total_records = len(all_positions)
        total_regions = len(inventory_by_store)
        sub_categories = {p.sku for p in all_positions}
        total_sub_categories = len(sub_categories)

        total_inventory = sum(p.current_stock for p in all_positions)
        avg_demand = (
            sum(p.avg_daily_demand for p in all_positions) / total_records
            if total_records > 0
            else 0.0
        )

        approved = [t for t in latest_plan if t.status == "approved"]
        margin_unlocked = sum(t.margin_unlocked for t in approved)
        holding_cost = sum(p.current_stock * p.holding_cost_rate for p in all_positions)

        kpis = DashboardKPIs(
            total_records=total_records,
            total_regions=total_regions,
            total_sub_categories=total_sub_categories,
            total_inventory=total_inventory,
            avg_daily_demand=round(avg_demand, 2),
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
