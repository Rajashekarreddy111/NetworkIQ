import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartCard, axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { useBenchmark } from "@/hooks/use-networkiq";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/benchmark")({
  head: () => ({
    meta: [
      { title: "Benchmark — NetworkIQ" },
      { name: "description", content: "Side-by-side comparison of the classical MILP solver and the NetworkIQ AI plan across cost, availability and coverage." },
      { property: "og:title", content: "Benchmark — NetworkIQ" },
      { property: "og:description", content: "Classical solver vs AI plan across cost, availability and coverage." },
    ],
  }),
  component: BenchmarkPage,
});

function BenchmarkPage() {
  const { data, isPending, isError, refetch } = useBenchmark();
  if (isPending) return <LoadingSkeleton rows={3} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Validation" title="Benchmark: Classical Solver vs AI Plan" description="Same demand, same capacity constraints, same budget envelope — evaluated over the August planning cycle." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {data.metrics.map((m) => {
          const delta = m.classical === 0 ? 100 : ((m.ai - m.classical) / Math.abs(m.classical)) * 100;
          const good = m.lowerIsBetter ? delta < 0 : delta > 0;
          return (
            <article key={m.metric} className="rounded-2xl glass-panel p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{m.metric}</p>
              <p className="numeric mt-2 text-2xl font-semibold">{m.unit === "%" ? `${m.ai}%` : `${m.unit}${m.ai}`}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Classical: <span className="numeric">{m.unit === "%" ? `${m.classical}%` : `${m.unit}${m.classical}`}</span>
              </p>
              <p className={cn("mt-2 inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold", good ? "bg-success/15 text-success" : "bg-danger/15 text-danger")}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}% improvement
              </p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Metric comparison" description="Classical solver vs AI plan" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.metrics} barSize={18}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="metric" {...axisProps} interval={0} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
              <YAxis {...axisProps} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="classical" fill="var(--muted-foreground)" radius={[6, 6, 0, 0]} name="Classical solver" />
              <Bar dataKey="ai" fill={chartColors.primary} radius={[6, 6, 0, 0]} name="NetworkIQ AI" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Capability radar" description="Normalized score out of 100" height={320}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data.radar}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Radar dataKey="classical" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.18} name="Classical" />
              <Radar dataKey="ai" stroke={chartColors.primary} fill={chartColors.primary} fillOpacity={0.28} name="NetworkIQ AI" />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
