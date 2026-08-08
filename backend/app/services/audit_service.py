from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock

from pydantic import BaseModel, ConfigDict, Field

from app.storage.json_store import json_store


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
    """Repository tracking planner actions and system audit trail entries in audit_logs.json."""

    def __init__(self) -> None:
        self._lock = RLock()

    def record(self, action: str, sku: str, location: str, details: str) -> AuditEntry:
        """Record a new audit entry into audit_logs.json."""
        with self._lock:
            existing = json_store.read_all("audit_logs")
            entry_id = f"audit_{len(existing) + 1:04d}"
            entry = AuditEntry(
                id=entry_id,
                action=action,
                sku=sku,
                location=location,
                details=details,
            )
            json_store.append("audit_logs", entry.model_dump())
            return entry

    def log_action(self, action: str, sku: str, user: str, details: str) -> AuditEntry:
        """Alias method for recording audit logs with user parameter."""
        return self.record(action=action, sku=sku, location=user, details=details)

    def get_audit_trail(self) -> list[AuditEntry]:
        """Return all recorded audit entries from audit_logs.json."""
        with self._lock:
            items = json_store.read_all("audit_logs")
            return [AuditEntry.model_validate(item) for item in items]


audit_service = AuditService()


def get_audit_service() -> AuditService:
    return audit_service
