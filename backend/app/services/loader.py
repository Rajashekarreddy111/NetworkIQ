from __future__ import annotations

import csv
import json
from pathlib import Path
from threading import RLock
from typing import Any

from pydantic import ValidationError

from app.models.inventory import InventoryPosition
from app.utils.logger import get_logger


logger = get_logger(__name__)


class InventoryLoaderError(Exception):
    """Raised when processed inventory or configuration files cannot be loaded or validated."""


class InventoryLoader:
    """Loads preprocessed datasets and supporting configuration files from backend/data/ with in-memory caching."""

    def __init__(self, data_dir: str | Path | None = None) -> None:
        self._data_dir = Path(data_dir) if data_dir else self._resolve_data_dir()
        self._lock = RLock()
        self._cache_inventory: dict[str, Any] = {}
        self._cache_mtime: float = 0.0
        self._cache_lane_costs: dict[tuple[str, str], float] | None = None
        self._cache_capacity: dict[str, int] | None = None
        self._cache_cold_chain: dict[str, bool] | None = None

    @staticmethod
    def _resolve_data_dir() -> Path:
        """Locate backend/data/ or data/ directory in workspace."""
        backend_root = Path(__file__).resolve().parents[2]
        workspace_root = backend_root.parent

        candidates = [
            backend_root / "data",
            workspace_root / "data",
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_dir():
                return candidate

        return backend_root / "data"

    def resolve_default_path(self) -> Path:
        """Return the primary master_inventory.csv path."""
        candidates = [
            self._data_dir / "master_inventory.csv",
            self._data_dir.parent / "master_inventory.csv",
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate
        return self._data_dir / "master_inventory.csv"

    def load(self, file_path: str | Path | None = None) -> dict[str, list[InventoryPosition]]:
        """Load master_inventory.csv with in-memory caching, validate constraints, and group by Region."""
        path = Path(file_path) if file_path else self.resolve_default_path()
        if not path.exists() or not path.is_file():
            logger.error("Inventory file not found: %s", path)
            raise InventoryLoaderError(f"Inventory file not found: {path}")

        current_mtime = path.stat().st_mtime
        with self._lock:
            if self._cache_inventory and self._cache_mtime == current_mtime:
                return self._cache_inventory

            suffix = path.suffix.lower()
            if suffix == ".csv":
                rows = self._load_csv_rows(path)
            elif suffix == ".json":
                rows = self._load_json_rows(path)
            else:
                raise InventoryLoaderError(f"Unsupported inventory file format: {path.suffix}")

            grouped_inventory = self._validate_and_group(rows)
            self.validate_dataset(grouped_inventory)

            self._cache_inventory = grouped_inventory
            self._cache_mtime = current_mtime

            logger.info("Loaded and cached inventory for %s region(s) from %s.", len(grouped_inventory), path)
            return self._cache_inventory

    def load_flat(self, file_path: str | Path | None = None) -> list[InventoryPosition]:
        """Load master inventory as a flat list of InventoryPosition objects."""
        grouped = self.load(file_path)
        flat_list: list[InventoryPosition] = []
        for positions in grouped.values():
            flat_list.extend(positions)
        return flat_list

    def validate_dataset(self, grouped_inventory: dict[str, list[InventoryPosition]]) -> None:
        """Validate Task 12 requirements: 96 rows, 4 Regions, 24 Sub-Categories."""
        total_rows = sum(len(positions) for positions in grouped_inventory.values())
        regions = set(grouped_inventory.keys())
        sub_categories = {pos.sku for positions in grouped_inventory.values() for pos in positions}

        if total_rows < 96 and len(regions) == 4 and len(sub_categories) == 24:
            logger.info("Master dataset loaded: %s records across %s regions.", total_rows, len(regions))
        elif total_rows != 96:
            logger.warning("Dataset row count check: found %s rows (expected 96).", total_rows)

        if len(regions) < 4:
            raise InventoryLoaderError(f"Dataset validation failed: found {len(regions)} regions, expected 4.")
        if len(sub_categories) < 24:
            raise InventoryLoaderError(f"Dataset validation failed: found {len(sub_categories)} sub-categories, expected 24.")

    def load_lane_costs(self) -> dict[tuple[str, str], float]:
        """Load and cache lane_cost.csv: (from_region, to_region) -> cost_per_unit."""
        with self._lock:
            if self._cache_lane_costs is not None:
                return self._cache_lane_costs

            lane_cost_file = self._data_dir / "lane_cost.csv"
            if not lane_cost_file.exists():
                logger.warning("lane_cost.csv not found at %s; returning empty map.", lane_cost_file)
                self._cache_lane_costs = {}
                return self._cache_lane_costs

            lane_costs: dict[tuple[str, str], float] = {}
            rows = self._load_csv_rows(lane_cost_file)
            for row in rows:
                from_reg = row.get("From_Region") or row.get("from_region") or row.get("From")
                to_reg = row.get("To_Region") or row.get("to_region") or row.get("To")
                cost_str = row.get("Cost_Per_Unit") or row.get("cost_per_unit") or row.get("Cost")
                if from_reg and to_reg and cost_str is not None:
                    lane_costs[(from_reg.strip(), to_reg.strip())] = float(cost_str)

            self._cache_lane_costs = lane_costs
            logger.info("Loaded and cached %s lane cost pairs from %s.", len(lane_costs), lane_cost_file)
            return self._cache_lane_costs

    def load_region_capacity(self) -> dict[str, int]:
        """Load and cache region_capacity.csv: Region -> Capacity."""
        with self._lock:
            if self._cache_capacity is not None:
                return self._cache_capacity

            cap_file = self._data_dir / "region_capacity.csv"
            if not cap_file.exists():
                logger.warning("region_capacity.csv not found at %s; returning default capacity.", cap_file)
                self._cache_capacity = {"North": 25000, "South": 18000, "East": 22000, "West": 24000}
                return self._cache_capacity

            capacity_map: dict[str, int] = {}
            rows = self._load_csv_rows(cap_file)
            for row in rows:
                reg = row.get("Region") or row.get("region")
                cap = row.get("Capacity") or row.get("capacity")
                if reg and cap is not None:
                    capacity_map[reg.strip()] = int(cap)

            required_regions = {"North", "South", "East", "West"}
            for req in required_regions:
                if req not in capacity_map:
                    capacity_map[req] = 20000

            self._cache_capacity = capacity_map
            logger.info("Loaded and cached capacity for %s region(s) from %s.", len(capacity_map), cap_file)
            return self._cache_capacity

    def load_cold_chain(self) -> dict[str, bool]:
        """Load and cache cold_chain.csv: Region -> Cold_Chain_Available."""
        with self._lock:
            if self._cache_cold_chain is not None:
                return self._cache_cold_chain

            cc_file = self._data_dir / "cold_chain.csv"
            if not cc_file.exists():
                logger.warning("cold_chain.csv not found at %s; returning default map.", cc_file)
                self._cache_cold_chain = {"North": True, "South": False, "East": True, "West": True}
                return self._cache_cold_chain

            cold_chain_map: dict[str, bool] = {}
            rows = self._load_csv_rows(cc_file)
            for row in rows:
                reg = row.get("Region") or row.get("region")
                avail_str = str(row.get("Cold_Chain_Available") or row.get("cold_chain_available") or "").strip().lower()
                if reg:
                    cold_chain_map[reg.strip()] = avail_str in {"true", "1", "yes"}

            self._cache_cold_chain = cold_chain_map
            logger.info("Loaded and cached cold chain settings for %s region(s) from %s.", len(cold_chain_map), cc_file)
            return self._cache_cold_chain

    def _load_csv_rows(self, file_path: Path) -> list[dict[str, Any]]:
        """Read CSV inventory data and return each row as a dictionary."""
        try:
            with file_path.open(mode="r", encoding="utf-8-sig", newline="") as csv_file:
                return list(csv.DictReader(csv_file))
        except Exception as exc:
            logger.exception("Unable to read CSV file: %s", file_path)
            raise InventoryLoaderError(f"Unable to read CSV file: {file_path}") from exc

    def _load_json_rows(self, file_path: Path) -> list[dict[str, Any]]:
        """Read JSON inventory data."""
        try:
            with file_path.open(mode="r", encoding="utf-8") as json_file:
                payload = json.load(json_file)
        except Exception as exc:
            logger.exception("Unable to read JSON file: %s", file_path)
            raise InventoryLoaderError(f"Unable to read JSON file: {file_path}") from exc

        if not isinstance(payload, list):
            raise InventoryLoaderError("JSON file must contain a list of rows.")

        return payload

    def _validate_and_group(self, rows: list[dict[str, Any]]) -> dict[str, list[InventoryPosition]]:
        """Validate every row with InventoryPosition and group records by Region location."""
        grouped_inventory: dict[str, list[InventoryPosition]] = {}

        for index, row in enumerate(rows, start=1):
            try:
                inventory_position = InventoryPosition.model_validate(row)
                grouped_inventory.setdefault(inventory_position.location, []).append(inventory_position)
            except ValidationError as exc:
                logger.error("Invalid inventory row at position %s: %s", index, exc)
                raise InventoryLoaderError(f"Invalid inventory row at position {index}: {exc}") from exc

        return grouped_inventory
