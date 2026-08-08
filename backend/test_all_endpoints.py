from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from app.models.response import ValidatedTransfer
from app.services.plan_repository import plan_repository
from main import app


class AllEndpointsTestCase(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)
        self.repo = plan_repository
        self.sample_transfer = ValidatedTransfer(
            sku="Milk",
            from_location="North",
            to_location="South",
            qty=10,
            transfer_cost=40.0,
            margin_unlocked=100.0,
            demand_basis="High demand in South",
            cost_trade_off="Unlocked margin > transfer cost",
            status="approved",
            cost_per_unit_moved=4.0,
        )
        self.repo.replace_latest_plan([self.sample_transfer])

    def test_get_root(self) -> None:
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "running")

    def test_get_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_get_config(self) -> None:
        response = self.client.get("/config")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["plannerThreshold"], 0.9)

    def test_get_benchmark(self) -> None:
        response = self.client.get("/benchmark")
        self.assertEqual(response.status_code, 200)
        self.assertIn(response.json()["status"], ["pending", "completed"])

    def test_get_dashboard(self) -> None:
        response = self.client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.json()["kpis"]["total_records"], 1)

    def test_get_inventory(self) -> None:
        response = self.client.get("/inventory")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_inventory_with_filters(self) -> None:
        response = self.client.get("/inventory?region=North&velocity=A")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_analytics(self) -> None:
        response = self.client.get("/analytics")
        self.assertEqual(response.status_code, 200)
        self.assertIn("velocity_distribution", response.json())

    def test_get_audit(self) -> None:
        response = self.client.get("/audit")
        self.assertEqual(response.status_code, 200)
        self.assertIn("entries", response.json())

    def test_get_plan(self) -> None:
        response = self.client.get("/plan")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_post_plan_decision(self) -> None:
        target_id = self.repo.get_transfer_id(self.sample_transfer)
        response = self.client.post(
            "/plan/decision",
            json={
                "id": target_id,
                "decision": "approve",
                "note": "Test approval note",
                "quantity": 10,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["decision"], "approve")


if __name__ == "__main__":
    unittest.main()
