import { CheckCircle2, Trash2, XCircle } from "lucide-react";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWarehouseStore } from "@/store/app-store";

export function ExcelPreview() {
  const rows = useWarehouseStore((s) => s.uploadRows);
  const uploadStatus = useWarehouseStore((s) => s.uploadStatus);
  const validateUpload = useWarehouseStore((s) => s.validateUpload);
  const deleteUploadRow = useWarehouseStore((s) => s.deleteUploadRow);
  const importUpload = useWarehouseStore((s) => s.importUpload);
  const userName = "Rohan Mehta";
  const valid = rows.filter((r) => r.status === "valid").length;
  const invalid = rows.length - valid;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Rows", rows.length],
          ["Valid Rows", valid],
          ["Invalid Rows", invalid],
          ["Upload Status", uploadStatus],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl glass-panel p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
            <p className="mt-2 numeric text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl glass-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Inventory Preview Table</h2>
            <p className="text-xs text-muted-foreground">Invalid rows are highlighted in red and can be removed before import.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={validateUpload}><CheckCircle2 className="mr-2 size-4" /> Validate</Button>
            <Button className="rounded-xl bg-gradient-primary" disabled={invalid > 0} onClick={() => importUpload(userName)}>Import Inventory</Button>
            <Button variant="ghost" className="rounded-xl">Cancel</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validation Errors</TableHead>
                <TableHead className="text-right">Delete</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className={row.status === "invalid" ? "bg-danger/10" : undefined}>
                  <TableCell className="numeric font-semibold">{row.sku || "Missing"}</TableCell>
                  <TableCell>{row.product || "Missing Product Name"}</TableCell>
                  <TableCell className="numeric">{row.stock}</TableCell>
                  <TableCell>{row.warehouse}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell><StatusBadge status={row.status === "valid" ? "Success" : "Failed"} variant={row.status === "valid" ? "success" : "danger"} /></TableCell>
                  <TableCell className="max-w-[260px] text-xs text-muted-foreground">{row.errors.join(", ") || "-"}</TableCell>
                  <TableCell className="text-right">
                    {row.status === "invalid" ? (
                      <Button variant="ghost" size="icon" className="size-8 text-danger" onClick={() => deleteUploadRow(row.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    ) : (
                      <XCircle className="ml-auto size-4 text-muted-foreground/50" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
