from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.models.user import UserResponse
from app.security.dependencies import require_roles, verify_region_access
from app.services.audit_service import AuditService
from app.services.loader import InventoryLoader
from app.storage.json_store import json_store
from app.utils.logger import get_logger


logger = get_logger(__name__)
router = APIRouter(prefix="/stock", tags=["stock"])
audit_service = AuditService()
stock_or_admin = require_roles(["stock_manager", "admin"])


class StockUpdateRequest(BaseModel):
    region: str = Field(..., description="Target store region (North, South, East, West)")
    sku: str = Field(..., description="Target SKU / Sub-Category")
    action: Literal["add", "remove"] = Field(..., description="Stock operation: add or remove")
    quantity: int = Field(..., gt=0, description="Quantity to add or remove")
    reason: str = Field("Manual stock adjustment", description="Adjustment reason")


@router.post(
    "/update",
    status_code=status.HTTP_200_OK,
    summary="Stock Manager: Add or remove inventory stock in assigned region",
)
def update_stock(
    payload: StockUpdateRequest,
    current_user: Annotated[UserResponse, Depends(stock_or_admin)],
) -> dict[str, Any]:
    """Update stock quantity for a SKU in assigned region with Region-Based Access Control."""
    # Enforce Region-Based Access Control
    verify_region_access(current_user, payload.region)

    loader = InventoryLoader()
    inventory_map = loader.load()

    target_region_positions = inventory_map.get(payload.region)
    if not target_region_positions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Region '{payload.region}' not found in inventory dataset.",
        )

    target_item = None
    for item in target_region_positions:
        if item.sku.lower() == payload.sku.lower():
            target_item = item
            break

    if not target_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SKU '{payload.sku}' not found in region '{payload.region}'.",
        )

    if payload.action == "remove" and target_item.current_stock < payload.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot remove {payload.quantity} units. Current stock is {target_item.current_stock}.",
        )

    old_stock = target_item.current_stock
    new_stock = old_stock + payload.quantity if payload.action == "add" else old_stock - payload.quantity
    object.__setattr__(target_item, "current_stock", new_stock)

    now_iso = datetime.now(timezone.utc).isoformat()
    history_entry = {
        "timestamp": now_iso,
        "region": payload.region,
        "sub_category": payload.sku,
        "sku": payload.sku,
        "action": payload.action,
        "quantity": payload.quantity,
        "old_stock": old_stock,
        "new_stock": new_stock,
        "updated_by": current_user.email,
        "user": current_user.email,
        "reason": payload.reason,
    }

    json_store.append("stock_history", history_entry)

    audit_service.log_action(
        action="STOCK_UPDATED",
        sku=payload.sku,
        user=current_user.email,
        details=f"User {current_user.name} ({current_user.role}) {payload.action}ed {payload.quantity} units for {payload.sku} in region {payload.region}. Stock changed: {old_stock} -> {new_stock}.",
    )

    logger.info(
        "Stock update: %s by %s in %s for %s (%s -> %s)",
        payload.action,
        current_user.email,
        payload.region,
        payload.sku,
        old_stock,
        new_stock,
    )

    return {
        "status": "success",
        "region": payload.region,
        "sku": payload.sku,
        "old_stock": old_stock,
        "new_stock": new_stock,
        "action": payload.action,
        "timestamp": now_iso,
    }


@router.get(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Stock Manager / Admin: View stock history entries",
)
def get_stock_history(
    current_user: Annotated[UserResponse, Depends(stock_or_admin)],
    region: Annotated[str | None, Query(description="Filter stock history by region")] = None,
) -> list[dict[str, Any]]:
    """Retrieve stock adjustment history from stock_history.json."""
    if current_user.role == "stock_manager":
        region = current_user.region

    entries = json_store.read_all("stock_history")
    if region:
        return [e for e in entries if e.get("region") == region]
    return entries
