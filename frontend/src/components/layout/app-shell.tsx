import { Navigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { WarehouseNavbar } from "@/components/warehouse/WarehouseNavbar";
import { WarehouseSidebar } from "@/components/warehouse/WarehouseSidebar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/app-store";
import { useUiStore } from "@/store/ui-store";

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const theme = useUiStore((s) => s.theme);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const authenticated = useAuthStore((s) => s.authenticated);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  if (!authenticated && pathname !== "/login") {
    return <Navigate to="/login" />;
  }

  if (pathname === "/login") {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const warehouseMode = role === "warehouse" || pathname.startsWith("/warehouse");
  const Sidebar = warehouseMode ? WarehouseSidebar : SidebarNav;
  const Topbar = warehouseMode ? WarehouseNavbar : Navbar;
  const sidebarWidth = collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]";

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <Sidebar />
      </aside>

      <div className={cn("transition-[padding] duration-300", sidebarWidth)}>
        <Topbar />
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:py-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
