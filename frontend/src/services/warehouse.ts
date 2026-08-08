import { categories } from "@/lib/types";
import { useWarehouseStore } from "@/store/app-store";

export const getWarehouseCategories = () => categories;

export const getWarehouseHealth = () => {
  const store = useWarehouseStore.getState();
  const warehouse = store.warehouse;
  const inventory = store.inventory;
  const unhealthy = inventory.filter((row) => row.status !== "Healthy").length;
  const healthScore = Math.max(62, Math.round(100 - unhealthy * 3.6));
  const pendingRequests = store.transferRequests.filter((request) => request.status === "Pending").length;

  return [
    {
      ...warehouse,
      inventoryCount: inventory.length,
      healthScore,
      pendingRequests,
    },
  ];
};
