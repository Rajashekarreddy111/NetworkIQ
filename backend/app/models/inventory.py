from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


PERISHABLE_SUB_CATEGORIES = {
    "milk",
    "pizzas",
    "burgers",
    "tomatoes",
    "fries",
}


class InventoryPosition(BaseModel):
    """
    Represents the inventory state of a single SKU / Sub-Category at a single Region.

    This model is received from Person A after preprocessing the Indian Store Sales dataset.
    It is the input to the Regional Agent.
    """

    sku: str = Field(
        ...,
        validation_alias=AliasChoices("Sub-Category", "Sub_Category", "sub_category", "sku"),
        description="Sub-Category or SKU identifier",
    )

    location: str = Field(
        ...,
        validation_alias=AliasChoices("Region", "region", "location"),
        description="Region / Store identifier",
    )

    current_stock: int = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("Current_Inventory", "current_inventory", "current_stock"),
        description="Current inventory stock available in region",
    )

    avg_daily_demand: float = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("Avg_Daily_Demand", "avg_daily_demand"),
        description="Average daily demand",
    )

    velocity_class: Literal["A", "B", "C"] = Field(
        ...,
        validation_alias=AliasChoices("Velocity_Class", "velocity_class"),
        description="ABC velocity classification",
    )

    unit_margin: float = Field(
        ...,
        ge=0,
        validation_alias=AliasChoices("Unit_Margin", "unit_margin"),
        description="Profit earned per unit",
    )

    perishable: bool = Field(
        False,
        validation_alias=AliasChoices("Perishable", "perishable"),
        description="Whether the product requires cold chain",
    )

    location_capacity_remaining: int = Field(
        1000,
        ge=0,
        validation_alias=AliasChoices("location_capacity_remaining", "capacity_remaining", "Capacity_Remaining", "Capacity"),
        description="Remaining storage capacity",
    )

    holding_cost_rate: float = Field(
        0.0,
        ge=0,
        validation_alias=AliasChoices("Holding_Cost_Rate", "holding_cost_rate"),
        description="Assumed daily holding cost rate per unit",
    )

    lead_time: int = Field(
        0,
        ge=0,
        validation_alias=AliasChoices("Lead_Time", "lead_time"),
        description="Lead time in days",
    )

    reorder_point: float = Field(
        0.0,
        ge=0,
        validation_alias=AliasChoices("Reorder_Point", "reorder_point"),
        description="Reorder point threshold",
    )

    reorder_status: bool = Field(
        False,
        validation_alias=AliasChoices("Reorder_Status", "reorder_status"),
        description="Whether current inventory is below reorder point",
    )

    def model_post_init(self, __context: object) -> None:
        """Infer perishability if perishable field was not explicitly provided."""
        if not self.perishable and self.sku.lower() in PERISHABLE_SUB_CATEGORIES:
            object.__setattr__(self, "perishable", True)

    @property
    def capacity_remaining(self) -> int:
        """Alias property for location_capacity_remaining."""
        return self.location_capacity_remaining

    model_config = ConfigDict(
        extra="ignore",
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "sku": "Milk",
                "location": "North",
                "current_stock": 27,
                "avg_daily_demand": 3.4,
                "velocity_class": "A",
                "unit_margin": 663.5,
                "perishable": True,
                "location_capacity_remaining": 25000,
            }
        },
    )