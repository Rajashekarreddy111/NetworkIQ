from typing import Literal

from pydantic import AliasChoices, BaseModel, Field


class InventoryPosition(BaseModel):
    """
    Represents the inventory state of a single SKU at a single store.

    This model is received from Person A after preprocessing the dataset.
    It is the input to the Regional (Store) Agent.
    """

    sku: str = Field(
        ...,
        description="Unique SKU identifier"
    )

    location: str = Field(
        ...,
        description="Store identifier (used as agent grouping)"
    )

    current_stock: int = Field(
        ...,
        ge=0,
        description="Current stock available at the store"
    )

    avg_daily_demand: float = Field(
        ...,
        ge=0,
        description="Average daily demand of the SKU"
    )

    velocity_class: Literal["A", "B", "C"] = Field(
        ...,
        description="ABC velocity classification"
    )

    unit_margin: float = Field(
        ...,
        ge=0,
        description="Profit earned per unit sold"
    )

    perishable: bool = Field(
        ...,
        description="Whether the SKU requires cold chain"
    )

    location_capacity_remaining: int = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("location_capacity_remaining", "capacity_remaining"),
        description="Remaining storage capacity"
    )

    @property
    def capacity_remaining(self) -> int:
        """Alias property for location_capacity_remaining."""
        return self.location_capacity_remaining

    model_config = {
        "extra": "forbid",
        "json_schema_extra": {
            "example": {
                "sku": "SKU10234",
                "location": "Store_001",
                "current_stock": 128,
                "avg_daily_demand": 14.2,
                "velocity_class": "A",
                "unit_margin": 42.5,
                "perishable": False,
                "location_capacity_remaining": 340
            }
        }
    }