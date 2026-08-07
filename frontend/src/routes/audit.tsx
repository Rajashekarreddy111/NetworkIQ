import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";

import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { useAudit } from "@/hooks/use-networkiq";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — NetworkIQ" },
      { name: "description", content: "Immutable log of every AI recommendation, planner decision, execution and completion event." },
      { property: "og:title", content: "Audit Trail — NetworkIQ" },
      { property: "og:description", content: "Every recommendation, decision and execution, fully traceable." },
    ],
  }),
  component: AuditPage,
});

const stageLabel = {
  recommended: "AI recommended",
  reviewed: "Planner reviewed",
  executed: "Transfer executed",
  completed: "Cycle completed",
} as const;

function AuditPage() {
  const { data, isPending, isError, refetch } = useAudit();
  if (isPending) return <LoadingSkeleton rows={6} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Governance" title="Audit Trail" description="Every decision is attributable — agent, planner, timestamp and rationale." />

      <div className="grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <section className="rounded-2xl glass-panel p-5">
          <h3 className="mb-4 text-sm font-semibold">Decision timeline</h3>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {data.entries.slice(0, 10).map((e, i) => (
              <motion.li key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <span className="absolute -left-[7px] mt-1.5 size-3.5 rounded-full bg-gradient-primary ring-4 ring-background" />
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{stageLabel[e.stage]}</p>
                  <StatusBadge status={e.decision} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {e.sku} · {e.transfer} · {e.planner}
                </p>
                <p className="numeric text-[11px] text-muted-foreground">{e.timestamp}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className="overflow-hidden rounded-2xl glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-elevated/95">
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {["Timestamp", "SKU", "Transfer", "Planner", "Decision", "Reason", "Status"].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.entries.map((e) => (
                  <tr key={e.id} className="transition-colors hover:bg-accent/30">
                    <td className="numeric whitespace-nowrap px-3 py-3 text-xs">{e.timestamp}</td>
                    <td className="numeric whitespace-nowrap px-3 py-3 text-xs font-semibold">{e.sku}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">{e.transfer}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs">{e.planner}</td>
                    <td className="px-3 py-3"><StatusBadge status={e.decision} /></td>
                    <td className="max-w-[240px] px-3 py-3 text-[11px] text-muted-foreground">{e.reason}</td>
                    <td className="px-3 py-3"><StatusBadge status={e.status} dot={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
