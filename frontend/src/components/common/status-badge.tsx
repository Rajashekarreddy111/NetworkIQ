import { cn } from "@/lib/utils";

type Variant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "primary";

const map: Record<string, Variant> = {
  healthy: "success",
  approved: "success",
  executed: "success",
  completed: "success",
  low: "success",
  fast: "success",
  pending: "warning",
  "in transit": "warning",
  understock: "warning",
  medium: "warning",
  high: "warning",
  busy: "info",
  overstock: "info",
  overridden: "info",
  slow: "neutral",
  closed: "neutral",
  rejected: "danger",
  degraded: "danger",
  critical: "danger",
  "stockout risk": "danger",
  cancelled: "danger",
};

const styles: Record<Variant, string> = {
  success: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/12 text-warning ring-warning/25",
  danger: "bg-danger/12 text-danger ring-danger/25",
  info: "bg-info/12 text-info ring-info/25",
  primary: "bg-primary/15 text-primary-glow ring-primary/30",
  neutral: "bg-muted text-muted-foreground ring-border-strong",
};

export function StatusBadge({
  status,
  variant,
  dot = true,
  className,
}: {
  status: string;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}) {
  const v = variant ?? map[status.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset",
        styles[v],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {status}
    </span>
  );
}

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const pctValue = Math.round(value * 100);
  const tone = pctValue >= 90 ? "bg-success" : pctValue >= 80 ? "bg-primary" : "bg-warning";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${pctValue}%` }} />
      </div>
      <span className="numeric text-xs font-semibold">{pctValue}%</span>
    </div>
  );
}
