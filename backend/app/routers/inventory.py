from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.models.inventory import InventoryPosition
from app.services.loader import InventoryLoader


router = APIRouter(tags=["inventory"])


def get_inventory_loader() -> InventoryLoader:
    return InventoryLoader()


@router.get(
    "/inventory",
    response_model=list[InventoryPosition],
    status_code=status.HTTP_200_OK,
    summary="Get master inventory positions with optional filtering",
)
def get_inventory(
    region: Annotated[str | None, Query(description="Filter by store region / location")] = None,
    velocity: Annotated[str | None, Query(description="Filter by velocity class (A, B, C)")] = None,
    sub_category: Annotated[str | None, Query(description="Filter by Sub-Category / SKU name")] = None,
    loader: Annotated[InventoryLoader, Depends(get_inventory_loader)] = None,
) -> list[InventoryPosition]:
    """Retrieve validated master inventory positions loaded via InventoryLoader."""
    all_positions = loader.load_flat()

    if region:
        all_positions = [p for p in all_positions if p.location.lower() == region.lower()]
    if velocity:
        all_positions = [p for p in all_positions if p.velocity_class.lower() == velocity.lower()]
    if sub_category:
        all_positions = [p for p in all_positions if p.sku.lower() == sub_category.lower()]

    return all_positions
