import { createFileRoute } from "@tanstack/react-router";

import { PageHeader } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore, usePlannerStore } from "@/store/app-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — NetworkIQ" },
      { name: "description", content: "Planner profile, role permissions and recent approval activity inside NetworkIQ." },
      { property: "og:title", content: "Profile — NetworkIQ" },
      { property: "og:description", content: "Planner profile, permissions and recent approval activity." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const decisions = usePlannerStore((s) => s.decisions);
  const entries = Object.entries(decisions).slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Account" title="Planner Profile" description="Your identity, permissions and decision history in this workspace." />

      <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]">
        <section className="rounded-2xl glass-panel p-6 text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-2xl bg-gradient-primary text-2xl font-semibold text-primary-foreground">
            {user.initials}
          </div>
          <h2 className="mt-4 text-lg font-semibold">{user.name}</h2>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-3 flex justify-center gap-2">
            <StatusBadge status={user.role} dot={false} />
            <StatusBadge status="Active" variant="success" />
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-2 text-[11px]">
            {[
              ["Approvals", String(entries.length)],
              ["Region", user.location],
              ["Dept", user.department],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted/50 px-2 py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="numeric mt-0.5 truncate font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl glass-panel p-5">
            <h3 className="text-sm font-semibold">Account details</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs">
                <span className="text-muted-foreground">Full name</span>
                <Input defaultValue={user.name} className="mt-1.5" />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground">Email</span>
                <Input defaultValue={user.email} className="mt-1.5" />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground">Role</span>
                <Input defaultValue={user.role} className="mt-1.5" readOnly />
              </label>
              <label className="block text-xs">
                <span className="text-muted-foreground">Region</span>
                <Input defaultValue={user.location} className="mt-1.5" />
              </label>
            </div>
            <Button className="mt-4 rounded-xl bg-gradient-primary">Update profile</Button>
          </section>

          <section className="rounded-2xl glass-panel p-5">
            <h3 className="mb-3 text-sm font-semibold">Recent decisions</h3>
            {entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">No approval decisions recorded yet in this session.</p>
            ) : (
              <ul className="space-y-2">
                {entries.map(([id, d]) => (
                  <li key={id} className="flex items-center gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2 text-xs">
                    <span className="numeric font-semibold">{id}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.note || "No note provided"}</span>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
