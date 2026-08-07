import type { WarehouseInventoryItem } from "@/store/app-store";

export const getInventoryStatus = (item: WarehouseInventoryItem) => {
  if (item.currentStock <= item.minimumThreshold * 0.45) return "Critical";
  if (item.currentStock < item.minimumThreshold) return "Low Stock";
  if (item.currentStock > item.maximumCapacity * 0.9) return "Overstock";
  return "Healthy";
};

export const statusVariant = (status: string) =>
  status === "Healthy" ? "success" : status === "Low Stock" ? "warning" : status === "Critical" ? "danger" : "info";
