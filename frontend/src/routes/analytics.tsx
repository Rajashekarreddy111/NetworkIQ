import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard, axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { useAnalytics } from "@/hooks/use-networkiq";
import { compact } from "@/lib/format";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NetworkIQ" },
      { name: "description", content: "Deep analytics on demand, warehouse performance, category contribution and inventory health across the network." },
      { property: "og:title", content: "Analytics — NetworkIQ" },
      { property: "og:description", content: "Demand, warehouse and category analytics across the inventory network." },
    ],
  }),
  component: AnalyticsPage,
});

const PIE = [chartColors.primary, chartColors.cyan, chartColors.green, chartColors.amber, chartColors.violet, chartColors.rose];

function AnalyticsPage() {
  const { data, isPending, isError, refetch } = useAnalytics();
  if (isPending) return <LoadingSkeleton rows={4} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const perf = data.warehouses.map((w) => ({ name: w.code.split("-")[0], utilization: w.utilization, onTime: w.onTime, stores: w.stores }));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Intelligence" title="Network Analytics" description="Demand, performance and health analytics across 10 nodes and 5 regions." />

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Demand forecast" description="Weekly units, next 5 weeks projected" className="xl:col-span-2" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.demandForecast}>
              <defs>
                <linearGradient id="a-dem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => compact(Number(v))} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="forecast" stroke={chartColors.primary} fill="url(#a-dem)" strokeWidth={2.2} name="Forecast" />
              <Line type="monotone" dataKey="actual" stroke={chartColors.green} strokeWidth={2.2} dot={false} name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category performance" description="Inventory value share (₹L)" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.inventoryDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={90} paddingAngle={3} stroke="var(--background)" strokeWidth={2}>
                {data.inventoryDistribution.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Warehouse performance" description="Utilization vs on-time dispatch" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={perf} barSize={14}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="utilization" fill={chartColors.primary} radius={[6, 6, 0, 0]} name="Utilization %" />
              <Bar dataKey="onTime" fill={chartColors.green} radius={[6, 6, 0, 0]} name="On-time %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Transfer frequency" description="Monthly lanes recommended vs executed" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.transferTrend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="recommended" stroke={chartColors.primary} strokeWidth={2.2} dot={{ r: 3 }} name="Recommended" />
              <Line type="monotone" dataKey="executed" stroke={chartColors.cyan} strokeWidth={2.2} dot={{ r: 3 }} name="Executed" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="rounded-2xl glass-panel p-5">
        <h3 className="text-sm font-semibold">Demand heatmap</h3>
        <p className="mb-4 text-xs text-muted-foreground">Region × category demand index (0-100)</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                <th className="px-2 py-2">Region</th>
                {data.heatmap[0]?.cells.map((c) => (
                  <th key={c.category} className="max-w-[90px] truncate px-2 py-2 font-semibold">{c.category}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.heatmap.map((row) => (
                <tr key={row.region}>
                  <td className="px-2 py-2 font-semibold">{row.region}</td>
                  {row.cells.map((c) => (
                    <td key={c.category} className="px-1 py-1">
                      <div
                        className="numeric grid h-9 place-items-center rounded-lg font-semibold"
                        style={{ background: `color-mix(in oklab, var(--chart-1) ${c.value}%, transparent)` }}
                      >
                        {c.value}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl glass-panel p-5">
          <h3 className="mb-3 text-sm font-semibold">Top SKUs by revenue potential</h3>
          <ul className="space-y-2">
            {data.topSkus.map((s) => (
              <li key={s.sku} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs">
                <span className="numeric font-semibold">{s.sku}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.product}</span>
                <StatusBadge status={s.velocity} dot={false} />
                <span className="numeric font-semibold">₹{s.revenue}L</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl glass-panel p-5">
          <h3 className="mb-3 text-sm font-semibold">Top warehouses</h3>
          <ul className="space-y-2">
            {[...data.warehouses].sort((a, b) => b.inventoryValue - a.inventoryValue).slice(0, 8).map((w) => (
              <li key={w.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs">
                <span className="font-semibold">{w.city}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{w.region} · {w.stores} stores</span>
                <span className="numeric">{w.utilization}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
