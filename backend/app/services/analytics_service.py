from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.inventory import InventoryPosition
from app.services.loader import InventoryLoader


class VelocityDistribution(BaseModel):
    class_a_count: int
    class_b_count: int
    class_c_count: int

    model_config = ConfigDict(extra="forbid")


class LocationStockSummary(BaseModel):
    location: str
    total_stock: int
    sku_count: int

    model_config = ConfigDict(extra="forbid")


class MoverSummary(BaseModel):
    sku: str
    location: str
    avg_daily_demand: float
    current_stock: int
    velocity_class: str

    model_config = ConfigDict(extra="forbid")


class AnalyticsResponse(BaseModel):
    velocity_distribution: VelocityDistribution
    location_summaries: list[LocationStockSummary]
    top_movers: list[MoverSummary]
    bottom_movers: list[MoverSummary]

    model_config = ConfigDict(extra="forbid")


class AnalyticsService:
    """Service that computes analytics metrics from InventoryLoader data."""

    def __init__(self, loader: InventoryLoader | None = None) -> None:
        self._loader = loader or InventoryLoader()

    def get_analytics(self) -> AnalyticsResponse:
        """Compute velocity distributions, location stock summaries, top/bottom movers."""
        inventory_by_store = self._loader.load()
        all_positions: list[InventoryPosition] = []

        location_summaries: list[LocationStockSummary] = []
        for loc, positions in inventory_by_store.items():
            all_positions.extend(positions)
            total_stock = sum(p.current_stock for p in positions)
            location_summaries.append(
                LocationStockSummary(
                    location=loc,
                    total_stock=total_stock,
                    sku_count=len(positions),
                )
            )

        a_count = sum(1 for p in all_positions if p.velocity_class == "A")
        b_count = sum(1 for p in all_positions if p.velocity_class == "B")
        c_count = sum(1 for p in all_positions if p.velocity_class == "C")

        sorted_by_demand = sorted(all_positions, key=lambda p: p.avg_daily_demand, reverse=True)

        top_movers = [
            MoverSummary(
                sku=p.sku,
                location=p.location,
                avg_daily_demand=p.avg_daily_demand,
                current_stock=p.current_stock,
                velocity_class=p.velocity_class,
            )
            for p in sorted_by_demand[:5]
        ]

        bottom_movers = [
            MoverSummary(
                sku=p.sku,
                location=p.location,
                avg_daily_demand=p.avg_daily_demand,
                current_stock=p.current_stock,
                velocity_class=p.velocity_class,
            )
            for p in sorted_by_demand[-5:]
        ]

        return AnalyticsResponse(
            velocity_distribution=VelocityDistribution(
                class_a_count=a_count,
                class_b_count=b_count,
                class_c_count=c_count,
            ),
            location_summaries=location_summaries,
            top_movers=top_movers,
            bottom_movers=bottom_movers,
        )
