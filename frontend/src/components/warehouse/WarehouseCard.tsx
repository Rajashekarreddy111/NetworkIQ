import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { compact, inr, num } from "@/lib/format";
import type { Warehouse } from "@/lib/types";

interface WarehouseCardProps extends Warehouse {
  inventoryCount: number;
  healthScore: number;
  pendingRequests: number;
}

export function WarehouseCard({ name, code, city, capacity, utilization, inventoryValue, inventoryCount, healthScore, pendingRequests }: WarehouseCardProps) {
  const status = healthScore > 86 ? "Healthy" : healthScore > 74 ? "Low Stock" : "Critical";

  return (
    <article className="rounded-2xl glass-panel p-4 transition-transform hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="numeric text-xs font-semibold text-muted-foreground">{code}</p>
          <h2 className="mt-1 font-display text-lg font-semibold leading-tight">{name}</h2>
          <p className="text-xs text-muted-foreground">{city}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-border bg-surface/50 p-3">
          <dt className="text-muted-foreground">Capacity</dt>
          <dd className="numeric mt-1 font-semibold">{compact(capacity)}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-3">
          <dt className="text-muted-foreground">Inventory</dt>
          <dd className="numeric mt-1 font-semibold">{num(inventoryCount)} SKUs</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-3">
          <dt className="text-muted-foreground">Value</dt>
          <dd className="numeric mt-1 font-semibold">{inr(inventoryValue)}</dd>
        </div>
        <div className="rounded-xl border border-border bg-surface/50 p-3">
          <dt className="text-muted-foreground">Pending Requests</dt>
          <dd className="numeric mt-1 font-semibold">{pendingRequests}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Health Score</span>
          <span className="numeric font-semibold">{healthScore}%</span>
        </div>
        <Progress value={healthScore} className="h-2" />
      </div>
      <div className="mt-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Capacity Used</span>
          <span className="numeric font-semibold">{utilization}%</span>
        </div>
        <Progress value={utilization} className="h-2" />
      </div>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="outline" className="flex-1 rounded-xl"><Eye className="mr-2 size-4" /> View</Button>
        <Button size="sm" className="flex-1 rounded-xl bg-success text-success-foreground hover:bg-success/90" onClick={() => toast.success("Transfer approved", { description: `${name} warehouse notified` })}>
          <Check className="mr-2 size-4" /> Approve
        </Button>
        <Button size="sm" variant="outline" className="flex-1 rounded-xl text-danger" onClick={() => toast.error("Transfer rejected", { description: `${name} warehouse notified` })}>
          <X className="mr-2 size-4" /> Reject
        </Button>
      </div>
    </article>
  );
}
