import { Eye, Pencil } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { num } from "@/lib/format";
import { getInventoryStatus } from "@/services/inventory";
import type { WarehouseInventoryItem } from "@/store/app-store";

export function InventoryTable({ rows }: { rows: WarehouseInventoryItem[] }) {
  return (
    <div className="overflow-hidden rounded-2xl glass-panel">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Minimum Threshold</TableHead>
              <TableHead>Available Capacity</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const status = getInventoryStatus(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="numeric font-semibold">{row.sku}</TableCell>
                  <TableCell>
                    <div className="min-w-[190px]">
                      <p className="font-medium">{row.product}</p>
                      <p className="text-xs text-muted-foreground">{row.category}</p>
                    </div>
                  </TableCell>
                  <TableCell className="numeric">{num(row.currentStock)}</TableCell>
                  <TableCell className="numeric">{num(row.minimumThreshold)}</TableCell>
                  <TableCell className="numeric">{num(Math.max(row.maximumCapacity - row.currentStock, 0))}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.lastUpdated}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="size-8 rounded-lg" aria-label={`View ${row.sku}`}>
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="size-8 rounded-lg" aria-label={`Edit ${row.sku}`}>
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
