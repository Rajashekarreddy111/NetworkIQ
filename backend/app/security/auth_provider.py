from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from app.models.user import UserResponse
from app.security.auth import hash_password, verify_password
from app.storage.json_store import json_store
from app.utils.logger import get_logger


logger = get_logger(__name__)


class AuthenticationProvider:
    """AuthenticationProvider reading users from environment variables and managing users.json."""

    def __init__(self) -> None:
        self.sync_env_users()

    def get_env_user_specs(self) -> list[dict[str, Any]]:
        """Extract configured user specs from environment variables."""
        return [
            {
                "_id": "usr_admin_001",
                "name": os.getenv("DEFAULT_ADMIN_NAME") or os.getenv("SEED_ADMIN_NAME", "Ananya Kulkarni"),
                "email": (os.getenv("DEFAULT_ADMIN_EMAIL") or os.getenv("SEED_ADMIN_EMAIL", "admin@networkiq.com")).strip().lower(),
                "password": os.getenv("DEFAULT_ADMIN_PASSWORD") or os.getenv("SEED_ADMIN_PASSWORD", "admin123"),
                "role": "admin",
                "region": "all",
                "isActive": True,
                "createdBy": "system",
            },
            {
                "_id": "usr_planner_001",
                "name": os.getenv("DEFAULT_PLANNER_NAME") or os.getenv("SEED_PLANNER_NAME", "Priya Shah"),
                "email": (os.getenv("DEFAULT_PLANNER_EMAIL") or os.getenv("SEED_PLANNER_EMAIL", "planner@networkiq.com")).strip().lower(),
                "password": os.getenv("DEFAULT_PLANNER_PASSWORD") or os.getenv("SEED_PLANNER_PASSWORD", "planner123"),
                "role": "planner",
                "region": "all",
                "isActive": True,
                "createdBy": "system",
            },
            {
                "_id": "usr_stock_north",
                "name": os.getenv("NORTH_MANAGER_NAME") or os.getenv("SEED_NORTH_MANAGER_NAME", "Rajesh Kumar"),
                "email": (os.getenv("NORTH_MANAGER_EMAIL") or os.getenv("SEED_NORTH_MANAGER_EMAIL", "north_manager@networkiq.com")).strip().lower(),
                "password": os.getenv("NORTH_MANAGER_PASSWORD") or os.getenv("SEED_NORTH_MANAGER_PASSWORD", "stock123"),
                "role": "stock_manager",
                "region": "North",
                "isActive": True,
                "createdBy": "system",
            },
            {
                "_id": "usr_stock_south",
                "name": os.getenv("SOUTH_MANAGER_NAME") or os.getenv("SEED_SOUTH_MANAGER_NAME", "Rohan Mehta"),
                "email": (os.getenv("SOUTH_MANAGER_EMAIL") or os.getenv("SEED_SOUTH_MANAGER_EMAIL", "south_manager@networkiq.com")).strip().lower(),
                "password": os.getenv("SOUTH_MANAGER_PASSWORD") or os.getenv("SEED_SOUTH_MANAGER_PASSWORD", "stock123"),
                "role": "stock_manager",
                "region": "South",
                "isActive": True,
                "createdBy": "system",
            },
            {
                "_id": "usr_stock_east",
                "name": os.getenv("EAST_MANAGER_NAME") or os.getenv("SEED_EAST_MANAGER_NAME", "Debasis Roy"),
                "email": (os.getenv("EAST_MANAGER_EMAIL") or os.getenv("SEED_EAST_MANAGER_EMAIL", "east_manager@networkiq.com")).strip().lower(),
                "password": os.getenv("EAST_MANAGER_PASSWORD") or os.getenv("SEED_EAST_MANAGER_PASSWORD", "stock123"),
                "role": "stock_manager",
                "region": "East",
                "isActive": True,
                "createdBy": "system",
            },
            {
                "_id": "usr_stock_west",
                "name": os.getenv("WEST_MANAGER_NAME") or os.getenv("SEED_WEST_MANAGER_NAME", "Siddharth Patil"),
                "email": (os.getenv("WEST_MANAGER_EMAIL") or os.getenv("SEED_WEST_MANAGER_EMAIL", "west_manager@networkiq.com")).strip().lower(),
                "password": os.getenv("WEST_MANAGER_PASSWORD") or os.getenv("SEED_WEST_MANAGER_PASSWORD", "stock123"),
                "role": "stock_manager",
                "region": "West",
                "isActive": True,
                "createdBy": "system",
            },
        ]

    def sync_env_users(self) -> None:
        """Ensure all environment-configured users exist in users.json with bcrypt hashed passwords."""
        existing_users = json_store.read_all("users")
        existing_map = {u.get("email"): u for u in existing_users if u.get("email")}

        updated = False
        now_iso = datetime.now(timezone.utc).isoformat()

        for spec in self.get_env_user_specs():
            email = spec["email"]
            if email not in existing_map:
                user_doc = {
                    "_id": spec["_id"],
                    "name": spec["name"],
                    "email": email,
                    "password": hash_password(str(spec["password"])),
                    "role": spec["role"],
                    "region": spec["region"],
                    "isActive": spec["isActive"],
                    "createdBy": spec["createdBy"],
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                }
                existing_users.append(user_doc)
                existing_map[email] = user_doc
                updated = True
                logger.info("Initialized env user: %s (%s)", email, spec["role"])

        if updated:
            json_store.write_all("users", existing_users)

    def authenticate_user(self, email: str, plain_password: str) -> dict[str, Any] | None:
        """Verify user credentials against bcrypt hashes in users.json."""
        self.sync_env_users()
        user_doc = json_store.find_one("users", {"email": email.strip().lower()})
        if not user_doc:
            return None

        hashed_pw = user_doc.get("password", "")
        if verify_password(plain_password, hashed_pw):
            return user_doc.copy()
        return None

    def get_user_by_email(self, email: str) -> dict[str, Any] | None:
        """Get user document by email."""
        self.sync_env_users()
        return json_store.find_one("users", {"email": email.strip().lower()})

    def get_user_by_id(self, user_id: str) -> dict[str, Any] | None:
        """Get user document by ID."""
        self.sync_env_users()
        return json_store.find_one("users", {"_id": user_id})

    def list_all_users(self) -> list[dict[str, Any]]:
        """List all registered users from users.json."""
        self.sync_env_users()
        return json_store.read_all("users")


auth_provider = AuthenticationProvider()


def get_auth_provider() -> AuthenticationProvider:
    return auth_provider
