from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from threading import RLock
from typing import Any

from app.utils.logger import get_logger


logger = get_logger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


class JSONStore:
    """Thread-safe, atomic JSON file repository manager preventing file corruption."""

    def __init__(self, data_directory: Path | None = None) -> None:
        self.data_dir = data_directory or DATA_DIR
        self._lock = RLock()
        self._ensure_storage()

    def _ensure_storage(self) -> None:
        """Create data directory and initialize required JSON files if missing or empty."""
        os.makedirs(self.data_dir, exist_ok=True)
        required_files = [
            "audit_logs.json",
            "planner_decisions.json",
            "stock_history.json",
            "approved_plans.json",
            "users.json",
        ]
        for filename in required_files:
            filepath = self.data_dir / filename
            if not filepath.exists() or filepath.stat().st_size == 0:
                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump([], f, indent=2)

    def _get_filepath(self, collection_name: str) -> Path:
        filename = collection_name if collection_name.endswith(".json") else f"{collection_name}.json"
        return self.data_dir / filename

    def read_all(self, collection_name: str) -> list[dict[str, Any]]:
        """Read all JSON items from specified collection file."""
        filepath = self._get_filepath(collection_name)
        with self._lock:
            if not filepath.exists() or filepath.stat().st_size == 0:
                return []
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data if isinstance(data, list) else []
            except Exception as exc:
                logger.error("Error reading JSON store file %s: %s", filepath, exc)
                return []

    def write_all(self, collection_name: str, items: list[dict[str, Any]]) -> None:
        """Atomically write JSON items to collection file using a temporary file."""
        filepath = self._get_filepath(collection_name)
        with self._lock:
            temp_fd, temp_path = tempfile.mkstemp(dir=self.data_dir, prefix="tmp_json_")
            try:
                with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
                    json.dump(items, f, indent=2, default=str)
                os.replace(temp_path, filepath)
            except Exception as exc:
                logger.error("Error writing JSON store file %s: %s", filepath, exc)
                if os.path.exists(temp_path):
                    try:
                        os.remove(temp_path)
                    except OSError:
                        pass
                raise

    def append(self, collection_name: str, item: dict[str, Any]) -> dict[str, Any]:
        """Append a single record atomically to a JSON collection."""
        with self._lock:
            items = self.read_all(collection_name)
            items.append(item)
            self.write_all(collection_name, items)
            return item

    def find_one(self, collection_name: str, filter_doc: dict[str, Any]) -> dict[str, Any] | None:
        """Find first item matching all key-value pairs in filter_doc."""
        items = self.read_all(collection_name)
        for item in items:
            if all(item.get(k) == v for k, v in filter_doc.items()):
                return item.copy()
        return None

    def update_one(
        self, collection_name: str, filter_doc: dict[str, Any], update_fields: dict[str, Any]
    ) -> bool:
        """Update fields of first item matching filter_doc."""
        with self._lock:
            items = self.read_all(collection_name)
            for idx, item in enumerate(items):
                if all(item.get(k) == v for k, v in filter_doc.items()):
                    items[idx].update(update_fields)
                    self.write_all(collection_name, items)
                    return True
            return False

    def delete_one(self, collection_name: str, filter_doc: dict[str, Any]) -> bool:
        """Delete first item matching filter_doc."""
        with self._lock:
            items = self.read_all(collection_name)
            for idx, item in enumerate(items):
                if all(item.get(k) == v for k, v in filter_doc.items()):
                    items.pop(idx)
                    self.write_all(collection_name, items)
                    return True
            return False


json_store = JSONStore()


def get_json_store() -> JSONStore:
    return json_store
