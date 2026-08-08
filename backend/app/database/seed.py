from __future__ import annotations

from datetime import datetime, timezone

from app.database.mongodb import db_manager
from app.security.auth import hash_password
from app.utils.logger import get_logger


logger = get_logger(__name__)


DEFAULT_USERS = [
    {
        "_id": "usr_admin_001",
        "name": "Ananya Kulkarni",
        "email": "admin@networkiq.com",
        "password": hash_password("admin123"),
        "role": "admin",
        "region": "all",
        "isActive": True,
        "createdBy": "system",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "_id": "usr_planner_001",
        "name": "Priya Shah",
        "email": "planner@networkiq.com",
        "password": hash_password("planner123"),
        "role": "planner",
        "region": "all",
        "isActive": True,
        "createdBy": "system",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "_id": "usr_stock_north",
        "name": "Rajesh Kumar",
        "email": "north_manager@networkiq.com",
        "password": hash_password("stock123"),
        "role": "stock_manager",
        "region": "North",
        "isActive": True,
        "createdBy": "admin@networkiq.com",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "_id": "usr_stock_south",
        "name": "Rohan Mehta",
        "email": "south_manager@networkiq.com",
        "password": hash_password("stock123"),
        "role": "stock_manager",
        "region": "South",
        "isActive": True,
        "createdBy": "admin@networkiq.com",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "_id": "usr_stock_east",
        "name": "Debasis Roy",
        "email": "east_manager@networkiq.com",
        "password": hash_password("stock123"),
        "role": "stock_manager",
        "region": "East",
        "isActive": True,
        "createdBy": "admin@networkiq.com",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
    {
        "_id": "usr_stock_west",
        "name": "Siddharth Patil",
        "email": "west_manager@networkiq.com",
        "password": hash_password("stock123"),
        "role": "stock_manager",
        "region": "West",
        "isActive": True,
        "createdBy": "admin@networkiq.com",
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    },
]


def seed_database() -> None:
    """Seed initial Admin, Planner, and Regional Stock Manager accounts into MongoDB."""
    users_coll = db_manager.get_collection("users")
    for user_doc in DEFAULT_USERS:
        existing = users_coll.find_one({"email": user_doc["email"]})
        if not existing:
            users_coll.insert_one(user_doc)
            logger.info("Seeded user: %s (%s)", user_doc["email"], user_doc["role"])

    logger.info("Database seeding completed.")
