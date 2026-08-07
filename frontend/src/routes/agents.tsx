import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Activity, Boxes, Brain, ShieldCheck, Truck, Warehouse } from "lucide-react";

import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { ConfidenceMeter, StatusBadge } from "@/components/common/status-badge";
import { useSelfCheck } from "@/hooks/use-networkiq";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Agent Monitor — NetworkIQ" },
      { name: "description", content: "Live health, latency and confidence for the six AI agents orchestrating inventory optimization." },
      { property: "og:title", content: "Agent Monitor — NetworkIQ" },
      { property: "og:description", content: "Live health and workflow of the six-agent optimization pipeline." },
    ],
  }),
  component: AgentsPage,
});

const icons = [Brain, Boxes, Warehouse, Truck, Activity, ShieldCheck];
const flow = ["Demand", "Inventory", "Coordinator", "Optimization", "Guardrail", "Planner"];

function AgentsPage() {
  const { data, isPending, isError, refetch } = useSelfCheck();
  if (isPending) return <LoadingSkeleton rows={4} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Multi-agent orchestration"
        title="Agent Monitor"
        description="Six specialised agents negotiate every transfer decision. Guardrail has veto authority."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.agents.map((agent, i) => {
          const Icon = icons[i % icons.length]!;
          return (
            <motion.article
              key={agent.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl glass-panel p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary-glow">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight">{agent.name}</p>
                    <p className="text-[11px] text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <StatusBadge status={agent.status} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                {[
                  ["Latency", `${agent.latencyMs}ms`],
                  ["Uptime", `${agent.uptime}%`],
                  ["Throughput", agent.throughput],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted/50 px-2 py-1.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="numeric mt-0.5 truncate font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <ConfidenceMeter value={agent.confidence} className="mt-3" />
              <p className="mt-3 rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Current task · </span>
                {agent.currentTask}
              </p>
            </motion.article>
          );
        })}
      </section>

      <section className="rounded-2xl glass-panel p-5">
        <h3 className="text-sm font-semibold">Workflow pipeline</h3>
        <p className="mb-6 text-xs text-muted-foreground">Signal propagation across the agent graph, refreshed every cycle.</p>
        <ol className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
          {flow.map((step, i) => (
            <li key={step} className="flex flex-1 items-center gap-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.12 }}
                className="flex-1 rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 text-center"
              >
                <p className="text-xs font-semibold">{step}</p>
                <motion.div
                  className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-gradient-primary"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3, ease: "linear" }}
                  />
                </motion.div>
              </motion.div>
              {i < flow.length - 1 && (
                <svg width="28" height="28" className="hidden shrink-0 lg:block" aria-hidden>
                  <line x1="2" y1="14" x2="26" y2="14" stroke="var(--chart-2)" strokeWidth="2" strokeDasharray="4 6" className="animate-flow" />
                </svg>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl glass-panel p-5">
        <h3 className="mb-4 text-sm font-semibold">Live activity feed</h3>
        <ul className="space-y-2">
          {data.feed.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  f.level === "warning" ? "bg-warning" : f.level === "success" ? "bg-success" : "bg-primary",
                )}
              />
              <span className="font-semibold">{f.agent}</span>
              <span className="text-muted-foreground">{f.message}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{f.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
