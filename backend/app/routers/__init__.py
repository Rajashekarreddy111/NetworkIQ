from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ApiError(Exception):
    """Application-level API exception handled centrally by FastAPI."""

    status_code: int
    detail: str
