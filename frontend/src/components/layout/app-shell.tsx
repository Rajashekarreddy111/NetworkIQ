import { useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, type ReactNode } from "react";

import { Navbar } from "@/components/layout/navbar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

export function AppShell({ children }: { children: ReactNode }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const theme = useUiStore((s) => s.theme);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden border-r border-sidebar-border transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-[264px]",
        )}
      >
        <SidebarNav />
      </aside>

      <div className={cn("transition-[padding] duration-300", collapsed ? "lg:pl-[76px]" : "lg:pl-[264px]")}>
        <Navbar />
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
