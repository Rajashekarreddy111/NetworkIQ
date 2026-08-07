import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  Building2,
  CircleDollarSign,
  Gauge,
  PackageCheck,
  PiggyBank,
  Sparkles,
  Store,
  Truck,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { SummaryCard } from "@/components/common/summary-card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-networkiq";
import { compact, inr, num } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Dashboard — NetworkIQ" },
      {
        name: "description",
        content:
          "Live inventory network KPIs, demand forecasts, transfer trends and AI agent activity across 10 Indian distribution nodes.",
      },
      { property: "og:title", content: "Command Dashboard — NetworkIQ" },
      {
        property: "og:description",
        content: "Live network KPIs, demand forecasts and AI transfer recommendations in one console.",
      },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  chartColors.primary,
  chartColors.cyan,
  chartColors.green,
  chartColors.amber,
  chartColors.violet,
  chartColors.rose,
];

function DashboardPage() {
  const { data, isPending, isError, refetch } = useDashboard();

  if (isPending) return <LoadingSkeleton rows={5} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const m = data.metrics;
  const cards = [
    { label: "Total Warehouses", value: String(m.totalWarehouses), icon: Building2, hint: "5 regions · 3 cross-docks", tone: "primary" as const },
    { label: "Total Stores", value: num(m.totalStores), icon: Store, delta: 4.2, deltaLabel: "vs last quarter", tone: "primary" as const },
    { label: "Active SKUs", value: compact(m.activeSkus), icon: Boxes, delta: 2.6, deltaLabel: "catalog expansion", tone: "primary" as const },
    { label: "Inventory Value", value: inr(m.inventoryValue), icon: CircleDollarSign, delta: -3.1, deltaLabel: "capital released", invertDelta: true, tone: "success" as const },
    { label: "Holding Cost", value: inr(m.holdingCost), icon: PiggyBank, delta: -8.4, deltaLabel: "MoM", invertDelta: true, tone: "success" as const },
    { label: "Transfer Cost", value: inr(m.transferCost), icon: Truck, delta: 6.1, deltaLabel: "higher lane volume", invertDelta: true, tone: "warning" as const },
    { label: "Estimated Savings", value: inr(m.estimatedSavings), icon: Sparkles, delta: 18.9, deltaLabel: "AI plan vs classical", tone: "success" as const },
    { label: "AI Confidence", value: `${Math.round(m.aiConfidence * 100)}%`, icon: Gauge, hint: "ensemble average", progress: m.aiConfidence * 100, tone: "primary" as const },
    { label: "Pending Transfers", value: String(m.pendingTransfers), icon: PackageCheck, hint: "awaiting planner action", tone: "warning" as const },
    { label: "Rejected Transfers", value: String(m.rejectedTransfers), icon: XCircle, hint: "guardrail + planner", tone: "danger" as const },
    { label: "Warehouse Utilization", value: `${m.warehouseUtilization}%`, icon: Activity, progress: m.warehouseUtilization, hint: "network weighted", tone: "primary" as const },
    { label: "Stockout Risk", value: `${m.stockoutRisk}%`, icon: AlertTriangle, hint: "SKU-nodes below 8 days cover", tone: "danger" as const },
  ];

  const utilization = data.warehouses.map((w) => ({
    name: w.code.split("-")[0],
    utilization: w.utilization,
    headroom: 100 - w.utilization,
  }));

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-hero p-6 sm:p-8"
      >
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border-strong bg-background/40 px-3 py-1 backdrop-blur">
              <span className="size-1.5 rounded-full bg-success" />
              <span className="text-[11px] font-medium text-muted-foreground">
                Optimization cycle #41 completed 4 minutes ago
              </span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight sm:text-[38px]">
              Good evening, Ananya. <span className="gradient-text">Today's AI insights</span> are ready.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              The optimizer evaluated {compact(m.activeSkus)} SKU-node pairs across {m.totalWarehouses} distribution
              centres and surfaced <strong className="text-foreground">{m.pendingTransfers} high-value transfers</strong>{" "}
              worth <strong className="text-foreground">{inr(m.estimatedSavings)}</strong> in net savings. Stockout
              exposure is down to {m.stockoutRisk}% of the catalog.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button className="rounded-xl bg-gradient-primary shadow-glow">
                <Sparkles className="mr-2 size-4" /> Review recommendations
              </Button>
              <Button variant="outline" className="rounded-xl">
                Export executive brief
              </Button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              ["Plan quality", "0.6% MILP gap"],
              ["Lanes solved", "34 candidates"],
              ["Service level", "97.6%"],
              ["Solve time", "1.34s"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-border bg-background/40 px-4 py-3 backdrop-blur">
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{k}</dt>
                <dd className="numeric mt-1 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.section>

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <SummaryCard key={c.label} index={i} {...c} />
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Demand forecast vs actual"
          description="Network-wide weekly units with 90% confidence band"
          className="xl:col-span-2"
          height={300}
          action={<StatusBadge status="Prophet + XGBoost" variant="primary" dot={false} />}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.demandForecast}>
              <defs>
                <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => compact(Number(v))} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#band)" name="Upper bound" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="var(--background)" fillOpacity={0.9} name="Lower bound" />
              <Line type="monotone" dataKey="actual" stroke={chartColors.green} strokeWidth={2.4} dot={false} name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke={chartColors.primary} strokeWidth={2.4} strokeDasharray="5 4" dot={false} name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory distribution" description="Value share by category (₹L)" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.inventoryDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                stroke="var(--background)"
                strokeWidth={2}
              >
                {data.inventoryDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Transfer trend" description="Recommended vs approved vs executed" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.transferTrend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="recommended" fill={chartColors.primary} radius={[6, 6, 0, 0]} name="Recommended" />
              <Bar dataKey="approved" fill={chartColors.cyan} radius={[6, 6, 0, 0]} name="Approved" />
              <Line type="monotone" dataKey="savings" stroke={chartColors.amber} strokeWidth={2.4} dot={{ r: 3 }} name="Savings (₹L)" />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Warehouse utilization" description="Capacity used vs headroom" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={utilization} barSize={16}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axisProps} />
              <YAxis {...axisProps} unit="%" />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="utilization" stackId="a" fill={chartColors.primary} name="Used %" radius={[0, 0, 4, 4]} />
              <Bar dataKey="headroom" stackId="a" fill="var(--muted)" name="Headroom %" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fast vs slow movers" description="Share of active catalog" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.moverSplit}
                dataKey="value"
                nameKey="name"
                outerRadius={92}
                stroke="var(--background)"
                strokeWidth={2}
              >
                <Cell fill={chartColors.green} />
                <Cell fill={chartColors.primary} />
                <Cell fill={chartColors.rose} />
              </Pie>
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="rounded-2xl glass-panel p-4 sm:p-5">
        <PageHeader
          title="Recent AI activity"
          description="Agent decisions and guardrail events from the current optimization cycle"
        />
        <ol className="relative space-y-4 border-l border-border pl-6">
          {data.activities.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <span
                className={`absolute -left-[30px] top-1.5 grid size-4 place-items-center rounded-full ring-4 ring-background ${
                  a.level === "warning" ? "bg-warning" : a.level === "success" ? "bg-success" : "bg-primary"
                }`}
              />
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{a.message}</p>
                <StatusBadge status={a.agent} variant="neutral" dot={false} />
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  );
}
