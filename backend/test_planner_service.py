import unittest
from pathlib import Path

from app.models.cost import TransferContext, TransferWithCost
from app.models.inventory import InventoryPosition
from app.models.response import SelfCheckResult, ValidatedTransfer
from app.models.transfer import SurplusDeficit, TransferProposal
from app.services.planner import PlannerService, PlannerServiceError


def build_inventory(location: str) -> InventoryPosition:
    return InventoryPosition(
        sku="Milk",
        location=location,
        current_stock=100,
        avg_daily_demand=10.0,
        velocity_class="A",
        unit_margin=8.0,
        perishable=True,
        location_capacity_remaining=200,
    )


def build_proposal() -> TransferProposal:
    return TransferProposal(
        sku="Milk",
        from_location="North",
        to_location="South",
        qty=10,
        transfer_cost=35.0,
        margin_unlocked=96.0,
        demand_basis="Destination demand exceeds cover.",
        cost_trade_off="Margin exceeds transfer cost.",
    )


class FakeInventoryLoader:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def load(self, file_path: str | Path | None = None) -> dict[str, list[InventoryPosition]]:
        self.calls.append("loader")
        return {
            "North": [build_inventory("North")],
            "South": [build_inventory("South")],
        }


class FakeRegionalAgent:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def analyze_store(
        self,
        inventory_positions: list[InventoryPosition],
        *,
        model: str | None = None,
    ) -> list[SurplusDeficit]:
        self.calls.append(f"regional:{inventory_positions[0].location}")
        return [
            SurplusDeficit(
                sku=inventory_positions[0].sku,
                location=inventory_positions[0].location,
                status="surplus" if inventory_positions[0].location == "North" else "deficit",
                qty=10,
                confidence=0.93,
                reasoning="Test regional signal.",
            )
        ]


class FakeCoordinatorAgent:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def coordinate(
        self,
        regional_outputs: dict[str, list[SurplusDeficit]],
        *,
        model: str | None = None,
    ) -> list[TransferProposal]:
        self.calls.append("coordinator")
        self.regional_outputs = regional_outputs
        return [build_proposal()]


class FakeCostContextProvider:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def get_context(
        self,
        proposal: TransferProposal,
        inventory_by_location: dict[str, list[InventoryPosition]],
    ) -> TransferContext:
        self.calls.append("cost_context")
        return TransferContext(
            proposal=proposal,
            stock_qty=inventory_by_location[proposal.from_location][0].current_stock,
            unit_holding_cost_rate=1.5,
            expected_incremental_sales=12,
            unit_margin=8.0,
            lane_cost=3.5,
        )


class FakeCostEngine:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def calculate_all(self, contexts: list[TransferContext]) -> list[TransferWithCost]:
        self.calls.append("cost_engine")
        return [
            TransferWithCost(
                proposal=context.proposal,
                holding_cost=60.0,
                transfer_cost=35.0,
                margin_unlocked=96.0,
                cost_per_recommendation=3.5,
            )
            for context in contexts
        ]


class FakeValidationEngine:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def validate_all(self, transfers: list[TransferWithCost]) -> list[ValidatedTransfer]:
        self.calls.append("validation_engine")
        return [
            ValidatedTransfer(
                sku=transfer.proposal.sku,
                from_location=transfer.proposal.from_location,
                to_location=transfer.proposal.to_location,
                qty=transfer.proposal.qty,
                transfer_cost=transfer.transfer_cost,
                margin_unlocked=transfer.margin_unlocked,
                demand_basis=transfer.proposal.demand_basis,
                cost_trade_off=transfer.proposal.cost_trade_off,
                status="approved",
                rejection_reason=None,
                cost_per_unit_moved=transfer.cost_per_recommendation,
            )
            for transfer in transfers
        ]


class FakeSelfCheckAgent:
    def __init__(self, calls: list[str]) -> None:
        self.calls = calls

    def review_plan(self, validated_transfers: list[ValidatedTransfer]) -> SelfCheckResult:
        self.calls.append("self_check")
        return SelfCheckResult(
            plan_ok=True,
            flagged_transfers=[],
            notes=f"Reviewed {len(validated_transfers)} transfer(s).",
        )


class PlannerServiceTestCase(unittest.TestCase):
    def test_run_orchestrates_complete_workflow_in_order(self) -> None:
        calls: list[str] = []
        service = PlannerService(
            inventory_loader=FakeInventoryLoader(calls),
            regional_agent=FakeRegionalAgent(calls),
            coordinator_agent=FakeCoordinatorAgent(calls),
            cost_context_provider=FakeCostContextProvider(calls),
            cost_engine=FakeCostEngine(calls),
            validation_engine=FakeValidationEngine(calls),
            self_check_agent=FakeSelfCheckAgent(calls),
        )

        result = service.run("inventory.csv", model="test-model")

        self.assertEqual(
            calls,
            [
                "loader",
                "regional:North",
                "regional:South",
                "coordinator",
                "cost_context",
                "cost_engine",
                "validation_engine",
                "self_check",
            ],
        )
        self.assertEqual(len(result.inventory_by_location), 2)
        self.assertEqual(len(result.regional_outputs), 2)
        self.assertEqual(len(result.transfer_proposals), 1)
        self.assertEqual(len(result.costed_transfers), 1)
        self.assertEqual(len(result.validated_transfers), 1)
        self.assertIsNotNone(result.self_check)
        self.assertTrue(result.self_check.plan_ok)

    def test_run_requires_cost_context_provider_when_proposals_exist(self) -> None:
        calls: list[str] = []
        service = PlannerService(
            inventory_loader=FakeInventoryLoader(calls),
            regional_agent=FakeRegionalAgent(calls),
            coordinator_agent=FakeCoordinatorAgent(calls),
            cost_engine=FakeCostEngine(calls),
            validation_engine=FakeValidationEngine(calls),
        )

        with self.assertRaises(PlannerServiceError):
            service.run("inventory.csv")

        self.assertEqual(
            calls,
            [
                "loader",
                "regional:North",
                "regional:South",
                "coordinator",
            ],
        )


if __name__ == "__main__":
    unittest.main()
