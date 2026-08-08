from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel
from pymongo import MongoClient
from pymongo.database import Database

from app.utils.logger import get_logger


logger = get_logger(__name__)


class MongoDBManager:
    """MongoDB manager supporting local/remote MongoDB instance with automatic fallback."""

    def __init__(self, uri: str | None = None, db_name: str = "networkiq") -> None:
        self.uri = uri or os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        self.db_name = db_name
        self._client: MongoClient | None = None
        self._db: Database | None = None
        self._memory_db: dict[str, list[dict[str, Any]]] = {
            "users": [],
            "inventory": [],
            "stock_history": [],
            "planner_decisions": [],
            "audit_logs": [],
        }
        self.connect()

    def connect(self) -> None:
        """Attempt to connect to MongoDB server."""
        try:
            client = MongoClient(self.uri, serverSelectionTimeoutMS=2000)
            client.admin.command("ping")
            self._client = client
            self._db = client[self.db_name]
            logger.info("Successfully connected to MongoDB database '%s' at %s", self.db_name, self.uri)
        except Exception as exc:
            logger.warning(
                "MongoDB connection to %s failed (%s). Operating in-memory MongoDB store.",
                self.uri,
                exc,
            )
            self._client = None
            self._db = None

    @property
    def is_connected(self) -> bool:
        return self._db is not None

    def get_collection(self, name: str):
        """Get collection handle or fallback proxy."""
        if self._db is not None:
            return self._db[name]
        return MongoCollectionProxy(name, self._memory_db.setdefault(name, []))


class MongoCollectionProxy:
    """In-memory proxy emulating PyMongo Collection operations when offline."""

    def __init__(self, name: str, data_store: list[dict[str, Any]]) -> None:
        self.name = name
        self._store = data_store

    def find_one(self, filter_doc: dict[str, Any]) -> dict[str, Any] | None:
        for doc in self._store:
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                return doc.copy()
        return None

    def find(self, filter_doc: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        filter_doc = filter_doc or {}
        results = []
        for doc in self._store:
            if all(doc.get(k) == v for k, v in filter_doc.items()):
                results.append(doc.copy())
        return results

    def insert_one(self, doc: dict[str, Any]) -> Any:
        doc_copy = doc.copy()
        if "_id" not in doc_copy:
            doc_copy["_id"] = f"{self.name}_{len(self._store) + 1}_{int(datetime.now(timezone.utc).timestamp() * 1000)}"
        self._store.append(doc_copy)

        class InsertResult:
            inserted_id = doc_copy["_id"]

        return InsertResult()

    def update_one(self, filter_doc: dict[str, Any], update_doc: dict[str, Any]) -> Any:
        target = self.find_one(filter_doc)
        if not target:
            class UpdateResult:
                modified_count = 0
            return UpdateResult()

        index = -1
        for idx, doc in enumerate(self._store):
            if doc.get("_id") == target.get("_id"):
                index = idx
                break

        if index >= 0:
            set_fields = update_doc.get("$set", {})
            self._store[index].update(set_fields)

        class UpdateResult:
            modified_count = 1

        return UpdateResult()

    def delete_one(self, filter_doc: dict[str, Any]) -> Any:
        target = self.find_one(filter_doc)
        if not target:
            class DeleteResult:
                deleted_count = 0
            return DeleteResult()

        self._store = [d for d in self._store if d.get("_id") != target.get("_id")]

        class DeleteResult:
            deleted_count = 1

        return DeleteResult()

    def count_documents(self, filter_doc: dict[str, Any] | None = None) -> int:
        return len(self.find(filter_doc))


db_manager = MongoDBManager()


def get_db_manager() -> MongoDBManager:
    return db_manager
