import unittest

from app.fixtures.mock_cost_context import MockCostContextConfig, build_mock_transfer_contexts
from app.models.cost import TransferContext, TransferWithCost
from app.models.transfer import TransferProposal
from app.services.cost_engine import CostEngine


class CostEngineTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = CostEngine()
        self.context = TransferContext(
            proposal=TransferProposal(
                sku="SKU1001",
                from_location="Store_001",
                to_location="Store_002",
                qty=10,
                transfer_cost=0.0,
                margin_unlocked=0.0,
                demand_basis="Test demand basis",
                cost_trade_off="Test cost trade off",
            ),
            stock_qty=40,
            unit_holding_cost_rate=1.5,
            expected_incremental_sales=12,
            unit_margin=8.0,
            lane_cost=3.5,
        )

    def test_calculate_transfer_cost(self) -> None:
        self.assertEqual(self.engine.calculate_transfer_cost(lane_cost=3.5, qty=10), 35.0)

    def test_calculate_holding_cost(self) -> None:
        self.assertEqual(self.engine.calculate_holding_cost(stock_qty=40, unit_holding_cost_rate=1.5), 60.0)

    def test_calculate_margin_unlocked(self) -> None:
        self.assertEqual(self.engine.calculate_margin_unlocked(expected_incremental_sales=12, unit_margin=8.0), 96.0)

    def test_calculate_cost_per_recommendation(self) -> None:
        self.assertEqual(self.engine.calculate_cost_per_recommendation(transfer_cost=35.0, qty=10), 3.5)

    def test_calculate_transfer(self) -> None:
        result = self.engine.calculate_transfer(self.context)

        self.assertIsInstance(result, TransferWithCost)
        self.assertEqual(result.proposal.sku, "SKU1001")
        self.assertEqual(result.holding_cost, 60.0)
        self.assertEqual(result.transfer_cost, 35.0)
        self.assertEqual(result.margin_unlocked, 96.0)
        self.assertEqual(result.cost_per_recommendation, 3.5)

    def test_calculate_all(self) -> None:
        contexts = build_mock_transfer_contexts(
            MockCostContextConfig(
                stock_qty=100,
                unit_holding_cost_rate=2.0,
                expected_incremental_sales=20,
                unit_margin=10.0,
                lane_cost=4.0,
                proposal_qty=5,
            )
        )

        results = self.engine.calculate_all(contexts)

        self.assertEqual(len(results), 2)
        self.assertTrue(all(isinstance(item, TransferWithCost) for item in results))
        self.assertEqual(results[0].holding_cost, 200.0)
        self.assertEqual(results[0].transfer_cost, 20.0)
        self.assertEqual(results[0].margin_unlocked, 200.0)
        self.assertEqual(results[0].cost_per_recommendation, 4.0)
        self.assertEqual(results[1].holding_cost, 280.0)
        self.assertEqual(results[1].transfer_cost, 70.0)
        self.assertEqual(results[1].margin_unlocked, 405.0)
        self.assertEqual(results[1].cost_per_recommendation, 7.0)


if __name__ == "__main__":
    unittest.main()
