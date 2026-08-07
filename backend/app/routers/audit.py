from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.services.audit_service import AuditResponse, AuditService, get_audit_service


router = APIRouter(tags=["audit"])


@router.get(
    "/audit",
    response_model=AuditResponse,
    status_code=status.HTTP_200_OK,
    summary="Get audit trail history for planner decisions and guardrails",
)
def get_audit(
    audit_service: Annotated[AuditService, Depends(get_audit_service)],
) -> AuditResponse:
    """Return historical audit entries recorded during transfer plan reviews."""
    entries = audit_service.get_audit_trail()
    return AuditResponse(entries=entries)
