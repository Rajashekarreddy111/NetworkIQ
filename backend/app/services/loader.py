from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from pydantic import ValidationError

from app.models.inventory import InventoryPosition


class InventoryLoaderError(Exception):
    """Raised when processed inventory cannot be loaded or validated."""


class InventoryLoader:
    """Loads processed inventory files and groups validated rows by store."""

    def load(self, file_path: str | Path) -> dict[str, list[InventoryPosition]]:
        """Load a CSV or JSON inventory file, validate each row, and group records by location."""
        path = Path(file_path)
        if not path.exists():
            raise InventoryLoaderError(f"Inventory file not found: {path}")
        if not path.is_file():
            raise InventoryLoaderError(f"Inventory path is not a file: {path}")

        suffix = path.suffix.lower()
        if suffix == ".csv":
            rows = self._load_csv_rows(path)
        elif suffix == ".json":
            rows = self._load_json_rows(path)
        else:
            raise InventoryLoaderError(
                f"Unsupported inventory file format: {path.suffix}. Supported formats are .csv and .json."
            )

        return self._validate_and_group(rows)

    def _load_csv_rows(self, file_path: Path) -> list[dict[str, Any]]:
        """Read CSV inventory data and return each row as a dictionary for model validation."""
        try:
            with file_path.open(mode="r", encoding="utf-8-sig", newline="") as csv_file:
                return list(csv.DictReader(csv_file))
        except csv.Error as exc:
            raise InventoryLoaderError(f"Invalid CSV file: {file_path}") from exc
        except OSError as exc:
            raise InventoryLoaderError(f"Unable to read CSV file: {file_path}") from exc

    def _load_json_rows(self, file_path: Path) -> list[dict[str, Any]]:
        """Read JSON inventory data and normalize it into a list of row dictionaries."""
        try:
            with file_path.open(mode="r", encoding="utf-8") as json_file:
                payload = json.load(json_file)
        except json.JSONDecodeError as exc:
            raise InventoryLoaderError(f"Invalid JSON file: {file_path}") from exc
        except OSError as exc:
            raise InventoryLoaderError(f"Unable to read JSON file: {file_path}") from exc

        if not isinstance(payload, list):
            raise InventoryLoaderError("JSON inventory file must contain a top-level list of rows.")

        for index, row in enumerate(payload, start=1):
            if not isinstance(row, dict):
                raise InventoryLoaderError(f"JSON row {index} must be an object.")

        return payload

    def _validate_and_group(self, rows: list[dict[str, Any]]) -> dict[str, list[InventoryPosition]]:
        """Validate every row with InventoryPosition and group valid records by store location."""
        grouped_inventory: dict[str, list[InventoryPosition]] = {}

        for index, row in enumerate(rows, start=1):
            try:
                inventory_position = InventoryPosition.model_validate(row)
            except ValidationError as exc:
                raise InventoryLoaderError(f"Invalid inventory row at position {index}: {exc}") from exc

            grouped_inventory.setdefault(inventory_position.location, []).append(inventory_position)

        return grouped_inventory
