import unittest

from app.fixtures.mock_validation_context import MockValidationConfig, MockValidationContextProvider
from app.guardrails.validator import GuardrailValidationError, ValidationEngine
from app.models.cost import TransferWithCost
from app.models.transfer import TransferProposal


class FailingProvider:
    def get_context(self, transfer: TransferWithCost):
        raise RuntimeError("mock provider failure")


class ValidationEngineTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.transfer = TransferWithCost(
            proposal=TransferProposal(
                sku="Milk",
                from_location="North",
                to_location="South",
                qty=10,
                transfer_cost=0.0,
                margin_unlocked=0.0,
                demand_basis="Test demand basis",
                cost_trade_off="Test cost trade off",
            ),
            holding_cost=50.0,
            transfer_cost=40.0,
            margin_unlocked=120.0,
            cost_per_recommendation=4.0,
        )

    def test_validate_transfer_approved(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    source_stock=100,
                    destination_capacity=80,
                    perishable=False,
                    cold_chain_available=True,
                    holding_cost_threshold=100.0,
                    signoff_value_threshold=200.0,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "approved")
        self.assertIsNone(result.rejection_reason)
        self.assertEqual(result.cost_per_unit_moved, 4.0)

    def test_validate_transfer_rejected_by_margin(self) -> None:
        engine = ValidationEngine(MockValidationContextProvider())
        transfer = self.transfer.model_copy(update={"margin_unlocked": 40.0})

        result = engine.validate_transfer(transfer)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.rejection_reason, "Rejected: margin unlocked is not greater than transfer cost.")

    def test_validate_transfer_rejected_by_holding_cost(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    holding_cost_threshold=40.0,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.rejection_reason, "Rejected: holding cost exceeds configured threshold.")

    def test_validate_transfer_rejected_by_stock(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    source_stock=5,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.rejection_reason, "Rejected: source stock is lower than transfer quantity.")

    def test_validate_transfer_rejected_by_capacity(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    destination_capacity=5,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.rejection_reason, "Rejected: destination capacity is lower than transfer quantity.")

    def test_validate_transfer_rejected_by_cold_chain(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    perishable=True,
                    cold_chain_available=False,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "rejected")
        self.assertEqual(result.rejection_reason, "Rejected: perishable transfer requires cold chain availability.")

    def test_validate_transfer_needs_signoff(self) -> None:
        engine = ValidationEngine(
            MockValidationContextProvider(
                MockValidationConfig(
                    signoff_value_threshold=20.0,
                )
            )
        )

        result = engine.validate_transfer(self.transfer)

        self.assertEqual(result.status, "needs_signoff")
        self.assertIsNone(result.rejection_reason)

    def test_validate_all(self) -> None:
        engine = ValidationEngine(MockValidationContextProvider())
        results = engine.validate_all([self.transfer, self.transfer])

        self.assertEqual(len(results), 2)
        self.assertTrue(all(result.status == "approved" for result in results))

    def test_provider_failure_raises_meaningful_exception(self) -> None:
        engine = ValidationEngine(FailingProvider())

        with self.assertRaises(GuardrailValidationError) as context:
            engine.validate_transfer(self.transfer)

        self.assertIn("Failed to load guardrail context for sku Milk", str(context.exception))


if __name__ == "__main__":
    unittest.main()
