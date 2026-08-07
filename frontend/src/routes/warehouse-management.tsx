import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { SummaryCard } from "@/components/common/summary-card";
import { WarehouseCard } from "@/components/warehouse/WarehouseCard";
import { Boxes, ClipboardList, Gauge, Warehouse } from "lucide-react";
import { getWarehouseHealth } from "@/services/warehouse";

export const Route = createFileRoute("/warehouse-management")({
  head: () => ({ meta: [{ title: "Warehouse Management - NetworkIQ" }] }),
  component: WarehouseManagement,
});

function WarehouseManagement() {
  const rows = getWarehouseHealth();
  const avgHealth = Math.round(rows.reduce((sum, row) => sum + row.healthScore, 0) / rows.length);
  const pending = rows.reduce((sum, row) => sum + row.pendingRequests, 0);
  const inventory = rows.reduce((sum, row) => sum + row.inventoryCount, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Warehouse Management" description="Admin control plane for capacity, inventory health, and pending warehouse transfer requests." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="All Warehouses" value={String(rows.length)} icon={Warehouse} />
        <SummaryCard label="Capacity" value={`${Math.round(rows.reduce((sum, row) => sum + row.utilization, 0) / rows.length)}%`} icon={Gauge} progress={avgHealth} />
        <SummaryCard label="Inventory" value={String(inventory)} icon={Boxes} />
        <SummaryCard label="Pending Requests" value={String(pending)} icon={ClipboardList} tone="warning" />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((warehouse) => <WarehouseCard key={warehouse.id} {...warehouse} />)}
      </section>
    </div>
  );
}
