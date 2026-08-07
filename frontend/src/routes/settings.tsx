import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useConfig } from "@/hooks/use-networkiq";
import { inr } from "@/lib/format";
import { warehouses } from "@/lib/mock-data";
import { useUiStore } from "@/store/ui-store";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NetworkIQ" },
      { name: "description", content: "Configure the optimization API, planner approval threshold, notifications and warehouse parameters." },
      { property: "og:title", content: "Settings — NetworkIQ" },
      { property: "og:description", content: "API, threshold, notification and warehouse configuration." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data, isPending, isError, refetch } = useConfig();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const [threshold, setThreshold] = useState(90);

  if (isPending) return <LoadingSkeleton rows={4} />;
  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Platform-level controls for the optimizer, planner policy and network parameters."
        actions={<Button className="rounded-xl bg-gradient-primary" onClick={() => toast.success("Configuration saved")}>Save changes</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl glass-panel p-5">
          <h2 className="text-sm font-semibold">API configuration</h2>
          <div className="mt-4 space-y-3">
            <label className="block text-xs">
              <span className="text-muted-foreground">Optimizer endpoint</span>
              <Input defaultValue={data.apiUrl} className="mt-1.5" />
            </label>
            <label className="block text-xs">
              <span className="text-muted-foreground">API key</span>
              <Input defaultValue={data.apiKey} className="mt-1.5 font-mono" />
            </label>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs">
              <span>Budget envelope per cycle</span>
              <span className="numeric font-semibold">{inr(data.budgetEnvelope)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl glass-panel p-5">
          <h2 className="text-sm font-semibold">Planner threshold</h2>
          <p className="mt-1 text-xs text-muted-foreground">Lanes above this confidence can auto-approve.</p>
          <p className="numeric mt-4 text-3xl font-semibold">{threshold}%</p>
          <Slider value={[threshold]} min={60} max={99} step={1} onValueChange={(v) => setThreshold(v[0] ?? 90)} className="mt-4" aria-label="Planner confidence threshold" />
          <div className="mt-5 flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs">
            <span>Auto-approve above threshold</span>
            <Switch defaultChecked={data.autoApprove} aria-label="Auto approve" />
          </div>
        </section>

        <section className="rounded-2xl glass-panel p-5">
          <h2 className="text-sm font-semibold">Appearance & notifications</h2>
          <div className="mt-4 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs">
              <span>Dark theme</span>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Dark theme" />
            </div>
            {[
              ["Email alerts", data.notifications.email],
              ["Slack digest", data.notifications.slack],
              ["Daily summary", data.notifications.digest],
              ["Critical only", data.notifications.criticalOnly],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-xs">
                <span>{label}</span>
                <Switch defaultChecked={Boolean(value)} aria-label={String(label)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl glass-panel p-5">
          <h2 className="text-sm font-semibold">Warehouse configuration</h2>
          <ul className="mt-4 space-y-2">
            {warehouses.map((w) => (
              <li key={w.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs">
                <span className="font-semibold">{w.code}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{w.name}</span>
                <StatusBadge status={`${w.utilization}%`} variant={w.utilization > 85 ? "danger" : w.utilization > 70 ? "warning" : "success"} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
