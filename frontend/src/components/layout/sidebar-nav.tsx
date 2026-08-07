import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Activity,
  BarChart3,
  Boxes,
  ChevronLeft,
  CircuitBoard,
  FileClock,
  Gauge,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Sparkles,
  Warehouse,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { to: "/inventory", label: "Inventory Network", icon: Boxes, group: "Overview" },
  { to: "/warehouse-management", label: "Warehouse Management", icon: Warehouse, group: "Overview" },
  { to: "/recommendations", label: "AI Recommendations", icon: Sparkles, group: "Optimization", badge: "14" },
  { to: "/approvals", label: "Planner Approval", icon: ShieldCheck, group: "Optimization" },
  { to: "/agents", label: "Agent Monitor", icon: CircuitBoard, group: "Optimization" },
  { to: "/benchmark", label: "Benchmark", icon: Gauge, group: "Intelligence" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, group: "Intelligence" },
  { to: "/audit", label: "Audit Trail", icon: FileClock, group: "Intelligence" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Account" },
  { to: "/profile", label: "Profile", icon: UserRound, group: "Account" },
] as const;

const groups = ["Overview", "Optimization", "Intelligence", "Account"] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full flex-col gap-2 bg-sidebar">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Activity className="size-5 text-primary-foreground" aria-hidden />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold leading-tight text-sidebar-foreground">
              NetworkIQ
            </p>
            <p className="truncate text-[11px] text-muted-foreground">AI Inventory Optimization</p>
          </div>
        )}
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group) => (
          <div key={group}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {group}
              </p>
            )}
            <ul className="space-y-1">
              {navItems
                .filter((i) => i.group === group)
                .map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all",
                          "focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "bg-sidebar-accent text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-primary"
                          />
                        )}
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0 transition-transform group-hover:scale-110",
                            active && "text-primary-glow",
                          )}
                          aria-hidden
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && "badge" in item && item.badge && (
                          <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary-glow">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-elevated/60 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 rounded-full bg-success animate-pulse-ring" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <p className="text-xs font-medium">Optimizer online</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Plan v41 · solved 1.34s · 6 agents healthy
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="mx-3 mb-4 hidden items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground lg:flex"
      >
        <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed && "Collapse"}
      </button>
    </div>
  );
}
