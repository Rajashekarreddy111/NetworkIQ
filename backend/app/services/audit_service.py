from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock

from pydantic import BaseModel, ConfigDict, Field


class AuditEntry(BaseModel):
    id: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    action: str
    sku: str
    location: str
    details: str

    model_config = ConfigDict(extra="forbid")


class AuditResponse(BaseModel):
    entries: list[AuditEntry]

    model_config = ConfigDict(extra="forbid")


class AuditService:
    """In-memory repository tracking planner actions and system audit trail entries."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._entries: list[AuditEntry] = []

    def record(self, action: str, sku: str, location: str, details: str) -> AuditEntry:
        """Record a new audit entry."""
        with self._lock:
            entry_id = f"audit_{len(self._entries) + 1:04d}"
            entry = AuditEntry(
                id=entry_id,
                action=action,
                sku=sku,
                location=location,
                details=details,
            )
            self._entries.append(entry)
            return entry

    def get_audit_trail(self) -> list[AuditEntry]:
        """Return all recorded audit entries."""
        with self._lock:
            return list(self._entries)


audit_service = AuditService()


def get_audit_service() -> AuditService:
    return audit_service
