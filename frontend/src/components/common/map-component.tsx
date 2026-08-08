import { motion } from "motion/react";
import { useState } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { inr } from "@/lib/format";
import type { Warehouse } from "@/lib/types";
import { cn } from "@/lib/utils";

const OUTLINE: [number, number][] = [
  [74.0, 34.5], [76.5, 35.5], [78.5, 34.5], [80.0, 32.5], [81.5, 30.4], [84.0, 28.9],
  [88.0, 27.9], [89.0, 26.8], [92.0, 27.9], [95.5, 28.2], [97.4, 27.0], [96.0, 24.0],
  [93.5, 23.0], [92.0, 21.5], [89.0, 21.8], [86.9, 20.7], [85.0, 19.5], [82.5, 17.0],
  [80.3, 15.8], [80.2, 13.5], [79.8, 10.3], [77.5, 8.1], [76.0, 9.5], [74.8, 13.0],
  [73.0, 16.0], [72.6, 19.0], [72.8, 21.5], [70.0, 22.5], [68.9, 23.7], [70.6, 25.5],
  [72.5, 27.5], [73.9, 30.0], [74.5, 32.0],
];

const W = 420;
const H = 500;
const project = (lng: number, lat: number): [number, number] => [
  ((lng - 67.5) / (98.5 - 67.5)) * W,
  H - ((lat - 6.5) / (37.5 - 6.5)) * H,
];

const outlinePath =
  OUTLINE.map(([lng, lat], i) => {
    const [x, y] = project(lng, lat);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";

export function MapComponent({
  warehouses,
  routes,
  selectedId,
  onSelect,
}: {
  warehouses: Warehouse[];
  routes: { from: string; to: string; volume: number }[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [hover, setHover] = useState<Warehouse | null>(null);
  const active = hover ?? warehouses.find((w) => w.id === selectedId) ?? null;

  return (
    <div className="relative overflow-hidden rounded-2xl glass-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Network Map · India</h3>
          <p className="text-xs text-muted-foreground">
            {warehouses.length} nodes · {routes.length} active transfer lanes
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-danger" /> &gt;85% used
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-warning" /> 70-85%
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-success" /> &lt;70%
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-[420px] w-full sm:h-[520px]"
          role="img"
          aria-label="Interactive map of Indian warehouse network with transfer lanes"
        >
          <defs>
            <radialGradient id="heat" cx="50%" cy="50%">
              <stop offset="0%" stopColor="var(--chart-5)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--chart-5)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="landfill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--chart-6)" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="lane" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              x2={W}
              y1={(i * H) / 12}
              y2={(i * H) / 12}
              stroke="var(--border)"
              strokeWidth="0.6"
            />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line
              key={`v${i}`}
              y1={0}
              y2={H}
              x1={(i * W) / 10}
              x2={(i * W) / 10}
              stroke="var(--border)"
              strokeWidth="0.6"
            />
          ))}

          <path d={outlinePath} fill="url(#landfill)" stroke="var(--border-strong)" strokeWidth="1.4" />

          {warehouses.map((w) => {
            const [x, y] = project(w.lng, w.lat);
            return (
              <circle key={`heat-${w.id}`} cx={x} cy={y} r={w.utilization * 0.7} fill="url(#heat)" />
            );
          })}

          {routes.map((route, i) => {
            const from = warehouses.find((w) => w.id === route.from);
            const to = warehouses.find((w) => w.id === route.to);
            if (!from || !to) return null;
            const [x1, y1] = project(from.lng, from.lat);
            const [x2, y2] = project(to.lng, to.lat);
            const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18;
            const my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
            return (
              <g key={`${route.from}-${route.to}`}>
                <path
                  d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                  fill="none"
                  stroke="url(#lane)"
                  strokeWidth={1 + route.volume / 55}
                  strokeLinecap="round"
                  opacity={0.75}
                />
                <path
                  d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
                  fill="none"
                  stroke="var(--chart-2)"
                  strokeWidth="1.4"
                  strokeDasharray="4 10"
                  className="animate-flow"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              </g>
            );
          })}

          {warehouses.map((w, i) => {
            const [x, y] = project(w.lng, w.lat);
            const tone =
              w.utilization > 85 ? "var(--danger)" : w.utilization > 70 ? "var(--warning)" : "var(--success)";
            const isActive = active?.id === w.id;
            return (
              <g
                key={w.id}
                tabIndex={0}
                role="button"
                aria-label={`${w.name}, ${w.utilization}% utilized`}
                className="cursor-pointer outline-none"
                onMouseEnter={() => setHover(w)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(w)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect?.(w.id)}
              >
                <circle cx={x} cy={y} r={isActive ? 16 : 11} fill={tone} opacity={0.16} />
                <motion.circle
                  cx={x}
                  cy={y}
                  r={isActive ? 6.5 : 5}
                  fill={tone}
                  stroke="var(--background)"
                  strokeWidth="1.6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 220 }}
                />
                <text
                  x={x + 10}
                  y={y + 3.5}
                  fontSize="9"
                  fill="var(--muted-foreground)"
                  className="pointer-events-none select-none"
                >
                  {w.code}
                </text>
              </g>
            );
          })}
        </svg>

        {active && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-2 left-2 right-2 rounded-xl border border-border-strong bg-popover/95 p-3 backdrop-blur-md sm:w-72 sm:right-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold leading-tight">{active.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {active.code} · {active.region} region · {active.stores} stores
                </p>
              </div>
              <StatusBadge
                status={`${active.utilization}%`}
                variant={active.utilization > 85 ? "danger" : active.utilization > 70 ? "warning" : "success"}
              />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              {[
                ["SKUs", active.skus.toLocaleString("en-IN")],
                ["Value", inr(active.inventoryValue)],
                ["On-time", `${active.onTime}%`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-muted/60 px-2 py-1.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="numeric font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export function WarehouseCard({
  warehouse,
  active,
  onClick,
}: {
  warehouse: Warehouse;
  active?: boolean;
  onClick?: () => void;
}) {
  const tone =
    warehouse.utilization > 85 ? "bg-danger" : warehouse.utilization > 70 ? "bg-warning" : "bg-success";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:bg-accent/40",
        active ? "border-primary/60 bg-primary/5" : "border-border bg-surface/40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold">{warehouse.city}</p>
        <span className="numeric text-xs text-muted-foreground">{warehouse.utilization}%</span>
      </div>
      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{warehouse.name}</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${warehouse.utilization}%` }} />
      </div>
    </button>
  );
}
