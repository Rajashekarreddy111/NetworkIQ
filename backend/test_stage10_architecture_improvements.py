import unittest

from fastapi.testclient import TestClient

from app.models.response import ValidatedTransfer
from app.services.plan_repository import PlanRepository, get_plan_repository
from main import app


def build_validated_transfer() -> ValidatedTransfer:
    return ValidatedTransfer(
        sku="SKU1001",
        from_location="Store_001",
        to_location="Store_002",
        qty=10,
        transfer_cost=35.0,
        margin_unlocked=96.0,
        demand_basis="Demand exceeds current cover at destination.",
        cost_trade_off="Transfer cost is lower than expected margin unlocked.",
        status="needs_signoff",
        rejection_reason=None,
        cost_per_unit_moved=3.5,
    )


class Stage10ArchitectureImprovementsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.repository = get_plan_repository()
        self.repository.replace_latest_plan([])

    def test_plan_repository_generates_stable_transfer_id(self) -> None:
        repository = PlanRepository()
        transfer = build_validated_transfer()

        self.assertEqual(
            repository.get_transfer_id(transfer),
            repository.get_transfer_id(transfer),
        )

    def test_approve_uses_stable_transfer_id_not_index(self) -> None:
        transfer = build_validated_transfer()
        self.repository.replace_latest_plan([transfer])
        transfer_id = self.repository.get_transfer_id(transfer)

        index_response = self.client.post("/plan/0/approve")
        id_response = self.client.post(f"/plan/{transfer_id}/approve")

        self.assertEqual(index_response.status_code, 404)
        self.assertEqual(id_response.status_code, 200)
        self.assertEqual(id_response.json()["status"], "approved")

    def test_selfcheck_returns_pending_response_when_agent_is_disabled(self) -> None:
        from app.routers.plan import get_self_check_agent

        app.dependency_overrides[get_self_check_agent] = lambda: None
        try:
            response = self.client.post("/selfcheck", json=[build_validated_transfer().model_dump()])

            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                response.json(),
                {
                    "status": "pending",
                    "message": "Self Check Agent is currently disabled.",
                },
            )
        finally:
            app.dependency_overrides.pop(get_self_check_agent, None)


if __name__ == "__main__":
    unittest.main()
