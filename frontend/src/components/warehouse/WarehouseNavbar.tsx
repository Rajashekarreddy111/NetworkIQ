import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Moon, Search, Sun, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { WarehouseSidebar } from "@/components/warehouse/WarehouseSidebar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore, useWarehouseStore } from "@/store/app-store";
import { useUiStore } from "@/store/ui-store";

export function WarehouseNavbar() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const requests = useWarehouseStore((s) => s.transferRequests);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  useEffect(() => setMounted(true), []);

  const pending = requests.filter((request) => request.status === "Pending").length;
  const signOut = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open warehouse navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Warehouse navigation</SheetTitle>
            <WarehouseSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link to="/warehouse" className="flex items-center gap-2 lg:hidden">
          <span className="font-display text-sm font-semibold">NetworkIQ Warehouse</span>
        </Link>

        <div className="relative ml-auto hidden max-w-md flex-1 items-center lg:ml-0 lg:flex">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            aria-label="Warehouse search"
            placeholder="Search SKU, request, supplier..."
            className="h-10 w-full rounded-xl border border-border bg-surface/60 pl-9 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 md:flex">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="text-[11px] font-medium text-muted-foreground">Bhiwandi DC live</span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Warehouse notifications" className="relative">
                <Bell className="size-5" />
                {pending > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-warning ring-2 ring-background" />}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[320px] p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Warehouse notifications</p>
                <p className="text-[11px] text-muted-foreground">{pending} transfer requests pending approval</p>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <p className="rounded-xl border border-border bg-success/10 p-3 text-xs text-success">
                  Inventory Successfully Updated
                </p>
                <p className="rounded-xl border border-border bg-warning/10 p-3 text-xs text-warning">
                  Admin approval needed for high-priority replenishment.
                </p>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {mounted && theme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </Button>

          <Link
            to="/warehouse/profile"
            className="hidden items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pl-1 pr-3 transition-colors hover:bg-accent/50 sm:flex"
          >
            <span className="grid size-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
              {user?.initials ?? "WM"}
            </span>
            <span className="text-left">
              <span className="block text-xs font-semibold leading-tight">{user?.name ?? "Warehouse Manager"}</span>
              <span className="block text-[10px] text-muted-foreground">{user?.title ?? "Warehouse Manager"}</span>
            </span>
          </Link>

          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Logout">
            <UserRound className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
