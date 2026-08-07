import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Activity,
  ChevronLeft,
  ClipboardList,
  FileClock,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  PanelsTopLeft,
  Upload,
  UserRound,
  Warehouse,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/app-store";
import { useUiStore } from "@/store/ui-store";

const items = [
  { to: "/warehouse", label: "Warehouse Dashboard", icon: LayoutDashboard },
  { to: "/warehouse/inventory", label: "Inventory", icon: Warehouse },
  { to: "/warehouse/add-inventory", label: "Add Inventory", icon: PackagePlus },
  { to: "/warehouse/upload", label: "Upload Excel", icon: Upload },
  { to: "/warehouse/transfer-requests", label: "Transfer Requests", icon: ClipboardList },
  { to: "/warehouse/history", label: "History", icon: FileClock },
  { to: "/warehouse/profile", label: "Profile", icon: UserRound },
] as const;

export function WarehouseSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="flex h-full flex-col gap-2 bg-sidebar">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <PanelsTopLeft className="size-5 text-primary-foreground" aria-hidden />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-semibold leading-tight text-sidebar-foreground">
              NetworkIQ
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Warehouse Portal</p>
          </div>
        )}
      </div>

      <nav aria-label="Warehouse" className="flex-1 overflow-y-auto px-3 pb-4">
        <p className={cn("px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70", collapsed && "sr-only")}>
          Operations
        </p>
        <ul className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-sidebar-accent text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="warehouse-sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-primary"
                    />
                  )}
                  <Icon className={cn("size-[18px] shrink-0 transition-transform group-hover:scale-110", active && "text-primary-glow")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="mx-3 rounded-2xl border border-border bg-elevated/60 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 rounded-full bg-success animate-pulse-ring" />
              <span className="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            <p className="text-xs font-medium">Dock flow healthy</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Bhiwandi DC · inbound scan rate 98.4%
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={signOut}
        className="mx-3 mt-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
      >
        <LogOut className="size-4" />
        {!collapsed && "Logout"}
      </button>

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
