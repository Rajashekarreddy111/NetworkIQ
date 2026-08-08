import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Download, Filter, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { FilterSelect, SearchBar } from "@/components/common/filters";
import { MapComponent, WarehouseCard } from "@/components/common/map-component";
import { ErrorState, EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/hooks/use-networkiq";
import { categories, regions, type InventoryRow } from "@/lib/types";
import { inr, num } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useInventoryFilters } from "@/store/app-store";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Network — NetworkIQ" },
      {
        name: "description",
        content:
          "Explore SKU-level stock, predicted demand, days of cover and risk across the Indian warehouse network with an interactive map.",
      },
      { property: "og:title", content: "Inventory Network — NetworkIQ" },
      {
        property: "og:description",
        content: "SKU-level stock, cover and risk across every distribution node.",
      },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { data, isPending, isError, refetch } = useInventory();
  const filters = useInventoryFilters();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (!data) return [];
    const whMap = new Map(data.warehouses.map((w) => [w.id, w]));
    return data.rows.filter((row) => {
      const wh = whMap.get(row.warehouseId);
      if (filters.region !== "all" && wh?.region !== filters.region) return false;
      if (filters.warehouse !== "all" && row.warehouseId !== filters.warehouse) return false;
      if (filters.category !== "all" && row.category !== filters.category) return false;
      if (filters.velocity !== "all" && row.velocity !== filters.velocity) return false;
      if (filters.risk !== "all" && row.risk !== filters.risk) return false;
      if (selectedWarehouse && row.warehouseId !== selectedWarehouse) return false;
      const q = filters.search.trim().toLowerCase();
      if (q && !`${row.sku} ${row.product}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, filters, selectedWarehouse]);

  if (isPending) return <LoadingSkeleton rows={6} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Network Visibility"
        title="Inventory Network"
        description="Live SKU × node position with predicted demand, cover and AI risk classification."
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => { filters.clear(); setSelectedWarehouse(null); }}>
              <RotateCcw className="mr-2 size-4" /> Reset
            </Button>
            <Button className="rounded-xl bg-gradient-primary">
              <Download className="mr-2 size-4" /> Export CSV
            </Button>
          </>
        }
      />

      <section className="rounded-2xl glass-panel p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Filter className="size-3.5" /> Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label="Region" value={filters.region} onChange={(v) => filters.set({ region: v })} allLabel="All regions" options={regions.map((r) => ({ value: r, label: r }))} />
          <FilterSelect label="Warehouse" value={filters.warehouse} onChange={(v) => filters.set({ warehouse: v })} allLabel="All warehouses" options={data.warehouses.map((w) => ({ value: w.id, label: w.city }))} />
          <FilterSelect label="Category" value={filters.category} onChange={(v) => filters.set({ category: v })} allLabel="All categories" options={categories.map((c) => ({ value: c, label: c }))} />
          <FilterSelect label="Velocity class" value={filters.velocity} onChange={(v) => filters.set({ velocity: v })} allLabel="All velocities" options={[{ value: "fast", label: "Fast" }, { value: "medium", label: "Medium" }, { value: "slow", label: "Slow" }]} />
          <FilterSelect label="Risk level" value={filters.risk} onChange={(v) => filters.set({ risk: v })} allLabel="All risk levels" options={[{ value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Search SKU</span>
            <SearchBar value={filters.search} onChange={(v) => filters.set({ search: v })} placeholder="SKU or product…" label="Search SKU" />
          </label>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{rows.length}</strong> SKU-node records
            </p>
            <div className="flex gap-2">
              <StatusBadge status={`${rows.filter((r) => r.risk === "critical").length} critical`} variant="danger" />
              <StatusBadge status={`${rows.filter((r) => r.status === "Overstock").length} overstock`} variant="info" />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState title="No SKUs match these filters" />
          ) : (
            <div className="overflow-hidden rounded-2xl glass-panel">
              <div className="max-h-[720px] overflow-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead className="sticky top-0 z-10 bg-elevated/95 backdrop-blur">
                    <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      {["SKU", "Product", "Warehouse", "Stock", "Pred. demand", "Days cover", "Velocity", "Capacity", "Risk", "Status", ""].map((h) => (
                        <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.slice(0, 60).map((row) => (
                      <InventoryTableRow
                        key={row.id}
                        row={row}
                        open={expanded === row.id}
                        onToggle={() => setExpanded(expanded === row.id ? null : row.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <MapComponent
            warehouses={data.warehouses}
            routes={data.routes}
            selectedId={selectedWarehouse}
            onSelect={(id) => setSelectedWarehouse(selectedWarehouse === id ? null : id)}
          />
          <div className="rounded-2xl glass-panel p-4">
            <h3 className="mb-3 text-sm font-semibold">Node utilization</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.warehouses.map((w) => (
                <WarehouseCard
                  key={w.id}
                  warehouse={w}
                  active={selectedWarehouse === w.id}
                  onClick={() => setSelectedWarehouse(selectedWarehouse === w.id ? null : w.id)}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InventoryTableRow({
  row,
  open,
  onToggle,
}: {
  row: InventoryRow;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr className={cn("transition-colors hover:bg-accent/30", open && "bg-accent/25")}>
        <td className="numeric whitespace-nowrap px-3 py-3 text-xs font-semibold">{row.sku}</td>
        <td className="max-w-[220px] px-3 py-3">
          <p className="truncate font-medium">{row.product}</p>
          <p className="truncate text-[11px] text-muted-foreground">{row.category}</p>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">{row.warehouse}</td>
        <td className="numeric px-3 py-3">{num(row.currentStock)}</td>
        <td className="numeric px-3 py-3">{num(row.predictedDemand)}</td>
        <td className="numeric px-3 py-3">
          <span className={cn(row.daysCover < 8 ? "text-danger" : row.daysCover > 70 ? "text-warning" : "text-success")}>
            {row.daysCover}d
          </span>
        </td>
        <td className="px-3 py-3">
          <StatusBadge status={row.velocity} dot={false} />
        </td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${row.capacityUsed}%` }} />
            </div>
            <span className="numeric text-[11px] text-muted-foreground">{row.capacityUsed}%</span>
          </div>
        </td>
        <td className="px-3 py-3">
          <StatusBadge status={row.risk} />
        </td>
        <td className="whitespace-nowrap px-3 py-3">
          <StatusBadge status={row.status} dot={false} />
        </td>
        <td className="px-3 py-3 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={`Toggle details for ${row.sku}`}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
          <tr>
            <td colSpan={11} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-y border-border bg-background/40"
              >
                <div className="grid gap-4 p-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface/50 p-3">
                    <p className="mb-2 text-xs font-semibold">Historical demand vs forecast</p>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={row.history}>
                          <defs>
                            <linearGradient id={`g-${row.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" {...axisProps} />
                          <YAxis {...axisProps} width={34} />
                          <Tooltip {...tooltipStyle} />
                          <Area type="monotone" dataKey="demand" stroke={chartColors.primary} fill={`url(#g-${row.id})`} strokeWidth={2} name="Demand" />
                          <Line type="monotone" dataKey="forecast" stroke={chartColors.amber} strokeWidth={2} dot={false} name="Forecast" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface/50 p-3">
                    <p className="mb-2 text-xs font-semibold">Stock trend</p>
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={row.history}>
                          <CartesianGrid stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" {...axisProps} />
                          <YAxis {...axisProps} width={34} />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey="stock" fill={chartColors.cyan} radius={[4, 4, 0, 0]} name="On hand" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-surface/50 p-3">
                      <p className="text-xs font-semibold">Inventory health</p>
                      <dl className="mt-2 space-y-2 text-xs">
                        {[
                          ["Inventory value", inr(row.currentStock * row.unitCost)],
                          ["Unit cost", inr(row.unitCost)],
                          ["Cover vs target (21d)", `${row.daysCover - 21 > 0 ? "+" : ""}${row.daysCover - 21}d`],
                          ["Velocity class", row.velocity],
                        ].map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="numeric font-semibold capitalize">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="rounded-xl border border-border bg-surface/50 p-3">
                      <p className="text-xs font-semibold">Warehouse utilization</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${row.capacityUsed}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {row.warehouse} node at {row.capacityUsed}% of usable pallet positions.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}
