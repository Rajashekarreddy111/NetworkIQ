from __future__ import annotations

import unittest

from fastapi.testclient import TestClient

from main import app


from app.database.seed import seed_database


class AuthAndRBACTestCase(unittest.TestCase):
    def setUp(self) -> None:
        seed_database()
        self.client = TestClient(app)

    def test_admin_login_success(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"email": "admin@networkiq.com", "password": "admin123"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["role"], "admin")

    def test_planner_login_success(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"email": "planner@networkiq.com", "password": "planner123"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user"]["role"], "planner")

    def test_invalid_login_failure(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"email": "admin@networkiq.com", "password": "wrong_password"},
        )
        self.assertEqual(response.status_code, 401)

    def test_admin_user_crud_operations(self) -> None:
        # 1. Login as Admin
        admin_login = self.client.post(
            "/auth/login",
            json={"email": "admin@networkiq.com", "password": "admin123"},
        )
        token = admin_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create a new Stock Manager
        create_resp = self.client.post(
            "/admin/users",
            headers=headers,
            json={
                "name": "Test Manager",
                "email": "test_north_manager@networkiq.com",
                "password": "password123",
                "role": "stock_manager",
                "region": "North",
                "isActive": True,
            },
        )
        self.assertEqual(create_resp.status_code, 201)
        created_user = create_resp.json()
        user_id = created_user["_id"]

        # 3. List users
        list_resp = self.client.get("/admin/users", headers=headers)
        self.assertEqual(list_resp.status_code, 200)

        # 4. Disable user
        disable_resp = self.client.put(f"/admin/users/{user_id}/disable", headers=headers)
        self.assertEqual(disable_resp.status_code, 200)
        self.assertFalse(disable_resp.json()["isActive"])

        # 5. Enable user
        enable_resp = self.client.put(f"/admin/users/{user_id}/enable", headers=headers)
        self.assertEqual(enable_resp.status_code, 200)
        self.assertTrue(enable_resp.json()["isActive"])

        # 6. Delete test user
        del_resp = self.client.delete(f"/admin/users/{user_id}", headers=headers)
        self.assertEqual(del_resp.status_code, 200)

    def test_region_access_control_enforcement(self) -> None:
        # 1. Login as North Manager
        north_login = self.client.post(
            "/auth/login",
            json={"email": "north_manager@networkiq.com", "password": "stock123"},
        )
        north_token = north_login.json()["access_token"]
        north_headers = {"Authorization": f"Bearer {north_token}"}

        # 2. North Manager updates North stock (Allowed)
        allowed_update = self.client.post(
            "/stock/update",
            headers=north_headers,
            json={
                "region": "North",
                "sku": "Tomatoes",
                "action": "add",
                "quantity": 5,
                "reason": "Test stock addition",
            },
        )
        self.assertEqual(allowed_update.status_code, 200)

        # 3. North Manager attempts to update South stock (Forbidden 403)
        forbidden_update = self.client.post(
            "/stock/update",
            headers=north_headers,
            json={
                "region": "South",
                "sku": "Milk",
                "action": "add",
                "quantity": 5,
                "reason": "Unauthorized cross-region stock edit",
            },
        )
        self.assertEqual(forbidden_update.status_code, 403)


if __name__ == "__main__":
    unittest.main()
