import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { ErrorState, EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { ConfidenceMeter, StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePlan } from "@/hooks/use-networkiq";
import { inr, num } from "@/lib/format";
import type { Recommendation } from "@/lib/mock-data";
import { usePlannerStore } from "@/store/app-store";

export const Route = createFileRoute("/approvals")({
  head: () => ({
    meta: [
      { title: "Planner Approval Center — NetworkIQ" },
      { name: "description", content: "Review, approve, reject or override AI transfer recommendations with full cost and demand context." },
      { property: "og:title", content: "Planner Approval Center — NetworkIQ" },
      { property: "og:description", content: "Approve, reject or override AI transfer plans with full context." },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { data, isPending, isError, refetch } = usePlan();
  const decisions = usePlannerStore((s) => s.decisions);
  const decide = usePlannerStore((s) => s.decide);
  const [active, setActive] = useState<Recommendation | null>(null);
  const [note, setNote] = useState("");

  if (isPending) return <LoadingSkeleton rows={5} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const rows = data.recommendations.map((r) => ({ ...r, status: decisions[r.id]?.status ?? r.status }));
  const buckets = {
    pending: rows.filter((r) => r.status === "pending"),
    approved: rows.filter((r) => r.status === "approved" || r.status === "executed"),
    rejected: rows.filter((r) => r.status === "rejected" || r.status === "overridden"),
  };

  const act = (rec: Recommendation, status: "approved" | "rejected" | "overridden") => {
    decide(rec.id, { status, note });
    setActive(null);
    setNote("");
    toast.success(`${rec.id} ${status}`, { description: `${rec.source} → ${rec.destination}` });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Human in the loop"
        title="Planner Approval Center"
        description="Every AI lane requires a decision above the 0.90 confidence threshold. Overrides are logged to the audit trail."
      />

      <Tabs defaultValue="pending">
        <TabsList className="rounded-xl">
          <TabsTrigger value="pending">Pending ({buckets.pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({buckets.approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({buckets.rejected.length})</TabsTrigger>
        </TabsList>
        {(["pending", "approved", "rejected"] as const).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            {buckets[key].length === 0 ? (
              <EmptyState title={`No ${key} transfers`} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {buckets[key].map((rec) => (
                  <article key={rec.id} className="rounded-2xl glass-panel p-4 transition-transform hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="numeric text-xs font-semibold text-muted-foreground">{rec.id}</p>
                        <p className="mt-0.5 text-sm font-semibold leading-tight">{rec.product}</p>
                        <p className="text-[11px] text-muted-foreground">{rec.sku}</p>
                      </div>
                      <StatusBadge status={rec.status} />
                    </div>
                    <p className="mt-3 rounded-xl bg-muted/50 px-3 py-2 text-xs">
                      {rec.source} <span className="text-primary-glow">→</span> {rec.destination} ·{" "}
                      <span className="numeric">{num(rec.quantity)} units</span>
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      {[
                        ["Business value", inr(rec.marginUnlocked)],
                        ["Transfer cost", inr(rec.transferCost)],
                        ["Margin", inr(rec.expectedProfit)],
                        ["Risk", rec.riskAnalysis.split(".")[0]],
                      ].map(([k, v]) => (
                        <div key={k} className="rounded-lg border border-border px-2 py-1.5">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="numeric mt-0.5 truncate font-semibold">{v}</dd>
                        </div>
                      ))}
                    </dl>
                    <ConfidenceMeter value={rec.confidence} className="mt-3" />
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1 rounded-lg bg-success text-success-foreground hover:bg-success/90" onClick={() => act(rec, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 rounded-lg text-danger" onClick={() => act(rec, "rejected")}>
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setActive(rec)}>
                        Override
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Override transfer {active?.id}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 text-sm">
              <div className="rounded-xl border border-border bg-surface/50 p-3 text-xs">
                <p className="font-semibold">Transfer details</p>
                <p className="mt-1 text-muted-foreground">
                  {active.sku} · {active.source} → {active.destination} · {num(active.quantity)} units
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-3 text-xs">
                <p className="font-semibold">Demand analysis</p>
                <p className="mt-1 text-muted-foreground">{active.demandBasis}. {active.reasoning}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface/50 p-3 text-xs">
                <p className="font-semibold">Inventory & cost breakdown</p>
                <p className="mt-1 text-muted-foreground">
                  Lane cost {inr(active.transferCost)} at ₹{active.costPerUnit}/unit · margin unlocked{" "}
                  {inr(active.marginUnlocked)} · net {inr(active.expectedProfit)}.
                </p>
              </div>
              <div>
                <label htmlFor="planner-note" className="text-xs font-semibold">Planner notes</label>
                <Textarea
                  id="planner-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason for override, revised quantity, constraints…"
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActive(null)}>Cancel</Button>
                <Button className="bg-gradient-primary" onClick={() => act(active, "overridden")}>
                  Save override
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
