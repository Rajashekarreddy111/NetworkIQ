from app.models.inventory import InventoryPosition

inventory = InventoryPosition(
    sku="SKU10234",
    location="Store_001",
    current_stock=120,
    avg_daily_demand=15.2,
    velocity_class="A",
    unit_margin=42.5,
    perishable=False,
    location_capacity_remaining=300
)

print(inventory.model_dump())