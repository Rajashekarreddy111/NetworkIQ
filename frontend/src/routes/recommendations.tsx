import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, PencilLine, Sparkles, TrendingUp, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { axisProps, chartColors, tooltipStyle } from "@/components/common/chart-card";
import { SearchBar } from "@/components/common/filters";
import { ErrorState, EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { ConfidenceMeter, StatusBadge } from "@/components/common/status-badge";
import { SummaryCard } from "@/components/common/summary-card";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/use-networkiq";
import { inr, num } from "@/lib/format";
import type { Recommendation } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/app-store";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "AI Recommendations — NetworkIQ" },
      {
        name: "description",
        content:
          "Explainable AI transfer recommendations with cost tradeoffs, margin unlocked, confidence scores and agent reasoning.",
      },
      { property: "og:title", content: "AI Recommendations — NetworkIQ" },
      { property: "og:description", content: "Explainable transfer recommendations with cost tradeoffs and confidence." },
    ],
  }),
  component: RecommendationsPage,
});

function RecommendationsPage() {
  const { data, isPending, isError, refetch } = usePlan();
  const decisions = usePlannerStore((s) => s.decisions);
  const decide = usePlannerStore((s) => s.decide);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const list = data?.recommendations ?? [];
    const q = search.trim().toLowerCase();
    return list
      .map((r) => ({ ...r, status: decisions[r.id]?.status ?? r.status }))
      .filter((r) => !q || `${r.sku} ${r.product} ${r.source} ${r.destination}`.toLowerCase().includes(q));
  }, [data, search, decisions]);

  if (isPending) return <LoadingSkeleton rows={6} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const pending = rows.filter((r) => r.status === "pending");
  const savings = rows.reduce((a, r) => a + r.expectedProfit, 0);
  const avgConf = rows.reduce((a, r) => a + r.confidence, 0) / Math.max(rows.length, 1);

  const act = (rec: Recommendation, status: "approved" | "rejected" | "overridden") => {
    decide(rec.id, { status });
    toast.success(
      status === "approved" ? `Transfer ${rec.id} approved` : status === "rejected" ? `Transfer ${rec.id} rejected` : `Transfer ${rec.id} overridden`,
      { description: `${rec.sku} · ${rec.source} → ${rec.destination}` },
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Optimization Engine"
        title="AI Recommendations"
        description="Plan v41 · every lane is explainable, guardrail-checked and traceable to the agent that produced it."
        actions={<SearchBar value={search} onChange={setSearch} placeholder="Search SKU or lane…" className="w-full sm:w-72" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard index={0} label="Recommendations" value={String(rows.length)} icon={Sparkles} hint="candidate lanes in plan v41" />
        <SummaryCard index={1} label="Expected Savings" value={inr(savings)} icon={Wallet} delta={18.9} deltaLabel="net of transfer cost" tone="success" />
        <SummaryCard index={2} label="Pending Approval" value={String(pending.length)} icon={TrendingUp} hint="awaiting planner decision" tone="warning" />
        <SummaryCard index={3} label="Average Confidence" value={`${Math.round(avgConf * 100)}%`} icon={Sparkles} progress={avgConf * 100} hint="ensemble across agents" />
      </section>

      {rows.length === 0 ? (
        <EmptyState title="No recommendations match your search" />
      ) : (
        <div className="overflow-hidden rounded-2xl glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1240px] text-sm">
              <thead className="bg-elevated/95">
                <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {["SKU", "Source", "Destination", "Qty", "Transfer cost", "Margin unlocked", "Demand basis", "Cost tradeoff", "₹/unit", "Status", "Confidence", "Actions"].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-3 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((rec) => (
                  <RecRow key={rec.id} rec={rec} open={open === rec.id} onToggle={() => setOpen(open === rec.id ? null : rec.id)} onAct={act} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function RecRow({
  rec,
  open,
  onToggle,
  onAct,
}: {
  rec: Recommendation;
  open: boolean;
  onToggle: () => void;
  onAct: (rec: Recommendation, status: "approved" | "rejected" | "overridden") => void;
}) {
  return (
    <>
      <tr className={cn("transition-colors hover:bg-accent/30", open && "bg-accent/25")}>
        <td className="px-3 py-3">
          <p className="numeric text-xs font-semibold">{rec.sku}</p>
          <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">{rec.product}</p>
        </td>
        <td className="whitespace-nowrap px-3 py-3 text-xs">{rec.source}</td>
        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-primary-glow">{rec.destination}</td>
        <td className="numeric px-3 py-3">{num(rec.quantity)}</td>
        <td className="numeric px-3 py-3">{inr(rec.transferCost)}</td>
        <td className="numeric px-3 py-3 text-success">{inr(rec.marginUnlocked)}</td>
        <td className="max-w-[180px] px-3 py-3 text-[11px] text-muted-foreground">{rec.demandBasis}</td>
        <td className="whitespace-nowrap px-3 py-3 text-[11px] text-muted-foreground">{rec.costTradeoff}</td>
        <td className="numeric px-3 py-3">₹{rec.costPerUnit}</td>
        <td className="px-3 py-3"><StatusBadge status={rec.status} /></td>
        <td className="px-3 py-3"><ConfidenceMeter value={rec.confidence} /></td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onToggle} aria-expanded={open}>
              Details <ChevronDown className={cn("ml-1 size-3.5 transition-transform", open && "rotate-180")} />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Approve" className="size-8 text-success hover:bg-success/15" onClick={() => onAct(rec, "approved")}>
              <Check className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Reject" className="size-8 text-danger hover:bg-danger/15" onClick={() => onAct(rec, "rejected")}>
              <X className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Override" className="size-8 text-warning hover:bg-warning/15" onClick={() => onAct(rec, "overridden")}>
              <PencilLine className="size-4" />
            </Button>
          </div>
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {open && (
          <tr>
            <td colSpan={12} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-y border-border bg-background/40"
              >
                <div className="grid gap-4 p-4 lg:grid-cols-[1.1fr_1fr]">
                  <div className="rounded-xl border border-border bg-surface/50 p-3">
                    <p className="mb-2 text-xs font-semibold">8-week demand vs transfer plan</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rec.forecast}>
                          <CartesianGrid stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="week" {...axisProps} />
                          <YAxis {...axisProps} width={40} />
                          <Tooltip {...tooltipStyle} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="destinationDemand" stroke={chartColors.primary} strokeWidth={2.2} dot={false} name={`${rec.destination} demand`} />
                          <Line type="monotone" dataKey="sourceDemand" stroke={chartColors.rose} strokeWidth={2.2} dot={false} name={`${rec.source} demand`} />
                          <Line type="monotone" dataKey="plan" stroke={chartColors.green} strokeWidth={2.2} strokeDasharray="5 4" dot={false} name="Transfer plan" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["Confidence", `${Math.round(rec.confidence * 100)}%`],
                        ["Expected profit", inr(rec.expectedProfit)],
                        ["Quantity", num(rec.quantity)],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-xl border border-border bg-surface/50 p-3">
                          <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{k}</p>
                          <p className="numeric mt-1 text-sm font-semibold">{v}</p>
                        </div>
                      ))}
                    </div>
                    {[
                      ["Reasoning", rec.reasoning],
                      ["Agent explanation", rec.agentExplanation],
                      ["Business impact", rec.businessImpact],
                      ["Risk analysis", rec.riskAnalysis],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-border bg-surface/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary-glow">{k}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v}</p>
                      </div>
                    ))}
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
