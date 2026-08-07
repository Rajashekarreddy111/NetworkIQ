import { categories, warehouses } from "@/lib/mock-data";
import { useWarehouseStore } from "@/store/app-store";

export const getWarehouses = () => warehouses;

export const getWarehouseCategories = () => categories;

export const getWarehouseHealth = () =>
  warehouses.map((warehouse) => {
    const inventory = useWarehouseStore.getState().inventory.filter((row) => row.warehouseId === warehouse.id);
    const unhealthy = inventory.filter((row) => row.status !== "Healthy").length;
    const healthScore = Math.max(62, Math.round(100 - unhealthy * 3.6 - Math.max(0, warehouse.utilization - 86) * 0.8));
    const pendingRequests = useWarehouseStore
      .getState()
      .transferRequests.filter((request) => request.warehouseId === warehouse.id && request.status === "Pending").length;

    return {
      ...warehouse,
      inventoryCount: inventory.length,
      healthScore,
      pendingRequests,
    };
  });
