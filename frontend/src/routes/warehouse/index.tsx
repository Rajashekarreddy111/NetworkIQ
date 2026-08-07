import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AlertTriangle, Boxes, ClipboardList, Gauge, PackageCheck, Warehouse } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard, axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { PageHeader } from "@/components/common/states";
import { SummaryCard } from "@/components/common/summary-card";
import { StatusBadge } from "@/components/common/status-badge";
import { compact, num } from "@/lib/format";
import { getInventoryStatus } from "@/services/inventory";
import { useWarehouseStore } from "@/store/app-store";

export const Route = createFileRoute("/warehouse/")({
  head: () => ({ meta: [{ title: "Warehouse Dashboard - NetworkIQ" }] }),
  component: WarehouseDashboard,
});

function WarehouseDashboard() {
  const warehouse = useWarehouseStore((s) => s.warehouse);
  const inventory = useWarehouseStore((s) => s.inventory).filter((row) => row.warehouseId === warehouse.id);
  const requests = useWarehouseStore((s) => s.transferRequests).filter((row) => row.warehouseId === warehouse.id);
  const history = useWarehouseStore((s) => s.history);
  const currentStock = inventory.reduce((sum, row) => sum + row.currentStock, 0);
  const availableCapacity = inventory.reduce((sum, row) => sum + Math.max(row.maximumCapacity - row.currentStock, 0), 0);
  const lowStock = inventory.filter((row) => ["Low Stock", "Critical"].includes(getInventoryStatus(row))).length;
  const overstock = inventory.filter((row) => getInventoryStatus(row) === "Overstock").length;
  const pending = requests.filter((row) => row.status === "Pending").length;
  const distribution = Object.entries(
    inventory.reduce<Record<string, number>>((acc, row) => {
      acc[row.category] = (acc[row.category] ?? 0) + row.currentStock;
      return acc;
    }, {}),
  ).slice(0, 6).map(([name, value]) => ({ name, value }));
  const lowStockData = inventory.slice(0, 10).map((row) => ({ sku: row.sku.slice(-4), stock: row.currentStock, min: row.minimumThreshold }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Warehouse operations"
        title="Bhiwandi Mega Distribution Center"
        description="Live inventory health, capacity headroom, request flow and recent stock activity for the logged-in warehouse."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Current Warehouse", value: warehouse.code, icon: Warehouse, hint: warehouse.city },
          { label: "Total SKUs", value: num(inventory.length), icon: Boxes, hint: "Warehouse scoped" },
          { label: "Current Stock", value: compact(currentStock), icon: PackageCheck, hint: "Units on hand" },
          { label: "Available Capacity", value: compact(availableCapacity), icon: Gauge, progress: Math.max(0, 100 - warehouse.utilization) },
          { label: "Low Stock Products", value: String(lowStock), icon: AlertTriangle, tone: "warning" as const },
          { label: "Overstock Products", value: String(overstock), icon: Gauge, tone: "primary" as const },
          { label: "Pending Requests", value: String(pending), icon: ClipboardList, tone: "warning" as const },
        ].map((card, index) => <SummaryCard key={card.label} index={index} {...card} />)}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Inventory Distribution" description="Units by category" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3} stroke="var(--background)" strokeWidth={2}>
                {distribution.map((_, index) => <Cell key={index} fill={[chartColors.primary, chartColors.cyan, chartColors.green, chartColors.amber, chartColors.rose, chartColors.violet][index % 6]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Low Stock Analysis" description="Current stock vs minimum threshold" className="xl:col-span-2" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lowStockData}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="sku" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="stock" fill={chartColors.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="min" fill={chartColors.amber} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Warehouse Capacity" description="Used capacity and headroom" height={260}>
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="numeric text-6xl font-semibold gradient-text">{warehouse.utilization}%</p>
              <p className="mt-2 text-sm text-muted-foreground">capacity utilized</p>
            </div>
          </div>
        </ChartCard>
        <section className="rounded-2xl glass-panel p-4 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Latest Activities timeline</h2>
          <div className="mt-4 space-y-3">
            {history.slice(0, 5).map((entry, index) => (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="flex items-start gap-3 rounded-xl border border-border bg-surface/50 p-3">
                <span className="mt-1 size-2 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{entry.detail}</p>
                    <StatusBadge status={entry.action} variant="primary" dot={false} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
