from __future__ import annotations

from app.models.cost import TransferContext, TransferWithCost
from app.services.loader import InventoryLoader


class CostEngine:
    """Deterministic service that computes transfer costs from structured inputs and lane_cost.csv."""

    def __init__(self, loader: InventoryLoader | None = None) -> None:
        self._loader = loader or InventoryLoader()
        self._lane_costs = self._loader.load_lane_costs()

    def get_lane_cost(self, from_region: str, to_region: str, fallback_cost: float = 5.0) -> float:
        """Lookup transportation cost per unit between regions from lane_cost.csv."""
        return self._lane_costs.get((from_region, to_region), fallback_cost)

    def calculate_transfer_cost(self, lane_cost: float, qty: int) -> float:
        """Calculate total transfer cost using the configured lane cost and transfer quantity."""
        return lane_cost * qty

    def calculate_holding_cost(self, stock_qty: int, unit_holding_cost_rate: float) -> float:
        """Calculate holding cost from stock quantity and unit holding cost rate."""
        return stock_qty * unit_holding_cost_rate

    def calculate_margin_unlocked(self, expected_incremental_sales: int, unit_margin: float) -> float:
        """Calculate unlocked margin from expected incremental sales and unit margin."""
        return expected_incremental_sales * unit_margin

    def calculate_cost_per_recommendation(self, transfer_cost: float, qty: int) -> float:
        """Calculate unit cost per recommendation from total transfer cost and transfer quantity."""
        if qty <= 0:
            return 0.0
        return transfer_cost / qty

    def calculate_transfer(self, context: TransferContext) -> TransferWithCost:
        """Compute all deterministic cost metrics for a single transfer context."""
        effective_lane_cost = (
            context.lane_cost
            if context.lane_cost > 0
            else self.get_lane_cost(context.proposal.from_location, context.proposal.to_location)
        )

        transfer_cost = self.calculate_transfer_cost(
            lane_cost=effective_lane_cost,
            qty=context.proposal.qty,
        )
        holding_cost = self.calculate_holding_cost(
            stock_qty=context.stock_qty,
            unit_holding_cost_rate=context.unit_holding_cost_rate,
        )
        margin_unlocked = self.calculate_margin_unlocked(
            expected_incremental_sales=context.expected_incremental_sales,
            unit_margin=context.unit_margin,
        )
        cost_per_recommendation = self.calculate_cost_per_recommendation(
            transfer_cost=transfer_cost,
            qty=context.proposal.qty,
        )

        return TransferWithCost(
            proposal=context.proposal,
            holding_cost=holding_cost,
            transfer_cost=transfer_cost,
            margin_unlocked=margin_unlocked,
            cost_per_recommendation=cost_per_recommendation,
        )

    def calculate_all(self, contexts: list[TransferContext]) -> list[TransferWithCost]:
        """Compute deterministic cost metrics for every provided transfer context."""
        return [self.calculate_transfer(context) for context in contexts]
