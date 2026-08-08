import { categories } from "@/lib/types";
import type { UploadPreviewRow } from "@/store/app-store";

export function validateUploadRows(rows: UploadPreviewRow[]) {
  const seen = new Set<string>();
  return rows.map((row) => {
    const errors: string[] = [];
    if (!row.sku.trim()) errors.push("Empty SKU");
    if (row.sku && seen.has(row.sku)) errors.push("Duplicate SKU");
    if (row.sku) seen.add(row.sku);
    if (!row.product.trim()) errors.push("Missing Product Name");
    if (row.stock < 0) errors.push("Negative Quantity");
    if (!categories.includes(row.category as any)) errors.push("Invalid Category");
    return { ...row, errors, status: errors.length ? "invalid" : "valid" } satisfies UploadPreviewRow;
  });
}
