from __future__ import annotations

from hashlib import sha256
from threading import RLock

from fastapi import status

from app.models.response import ValidatedTransfer
from app.routers import ApiError
from app.storage.json_store import json_store


class PlanRepository:
    """Stores and updates the latest validated plan exposed by the API layer, saving approved plans to approved_plans.json."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._latest_plan: list[ValidatedTransfer] = []

    def replace_latest_plan(self, transfers: list[ValidatedTransfer]) -> list[ValidatedTransfer]:
        with self._lock:
            self._latest_plan = list(transfers)
            return list(self._latest_plan)

    def get_latest_plan(self) -> list[ValidatedTransfer]:
        with self._lock:
            return list(self._latest_plan)

    def approve(self, transfer_id: str) -> ValidatedTransfer:
        with self._lock:
            index = self._find_index_by_transfer_id(transfer_id)
            transfer = self._latest_plan[index]
            approved = transfer.model_copy(update={"status": "approved", "rejection_reason": None})
            self._latest_plan[index] = approved

            # Persist approved recommendation inside approved_plans.json
            json_store.append("approved_plans", approved.model_dump())
            return approved

    def override(self, transfer_id: str, transfer: ValidatedTransfer) -> ValidatedTransfer:
        with self._lock:
            index = self._find_index_by_transfer_id(transfer_id)
            self._latest_plan[index] = transfer
            return transfer

    def get_transfer_id(self, transfer: ValidatedTransfer) -> str:
        """Build a stable identifier from existing transfer fields without changing the model schema."""
        raw_id = "|".join(
            [
                transfer.sku,
                transfer.from_location,
                transfer.to_location,
                str(transfer.qty),
                transfer.demand_basis,
            ]
        )
        return sha256(raw_id.encode("utf-8")).hexdigest()[:16]

    def _find_index_by_transfer_id(self, transfer_id: str) -> int:
        for index, transfer in enumerate(self._latest_plan):
            if self.get_transfer_id(transfer) == transfer_id:
                return index

        raise ApiError(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transfer id '{transfer_id}' was not found in the latest validated plan.",
        )


plan_repository = PlanRepository()


def get_plan_repository() -> PlanRepository:
    return plan_repository
