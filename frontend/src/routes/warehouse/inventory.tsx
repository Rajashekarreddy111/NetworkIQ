import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/common/states";
import { InventoryTable } from "@/components/warehouse/InventoryTable";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/lib/types";
import { getInventoryStatus } from "@/services/inventory";
import { useWarehouseStore } from "@/store/app-store";

export const Route = createFileRoute("/warehouse/inventory")({
  head: () => ({ meta: [{ title: "Warehouse Inventory - NetworkIQ" }] }),
  component: WarehouseInventory,
});

function WarehouseInventory() {
  const warehouse = useWarehouseStore((s) => s.warehouse);
  const inventory = useWarehouseStore((s) => s.inventory);
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [velocity, setVelocity] = useState("all");
  const [search, setSearch] = useState("");
  const rows = useMemo(
    () =>
      inventory
        .filter((row) => row.warehouseId === warehouse.id)
        .filter((row) => category === "all" || row.category === category)
        .filter((row) => velocity === "all" || row.velocity === velocity)
        .filter((row) => status === "all" || getInventoryStatus(row) === status)
        .filter((row) => !search || row.sku.toLowerCase().includes(search.toLowerCase()) || row.product.toLowerCase().includes(search.toLowerCase())),
    [category, inventory, search, status, velocity, warehouse.id],
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Warehouse Inventory" description="Inventory scoped to the logged-in warehouse only." />
      <section className="grid gap-3 rounded-2xl glass-panel p-4 md:grid-cols-4">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>{["all", "Healthy", "Low Stock", "Critical", "Overstock"].map((s) => <SelectItem key={s} value={s}>{s === "all" ? "All Status" : s}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={velocity} onValueChange={setVelocity}>
          <SelectTrigger className="rounded-xl"><SelectValue placeholder="Velocity" /></SelectTrigger>
          <SelectContent>{["all", "fast", "medium", "slow"].map((v) => <SelectItem key={v} value={v}>{v === "all" ? "All Velocity" : v}</SelectItem>)}</SelectContent>
        </Select>
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search SKU" className="rounded-xl" />
      </section>
      <InventoryTable rows={rows} />
    </div>
  );
}
