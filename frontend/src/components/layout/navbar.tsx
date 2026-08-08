import { Link } from "@tanstack/react-router";
import {
  Bell,
  Command,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { notifications } from "@/lib/types";
import { useAuthStore } from "@/store/app-store";
import { useUiStore } from "@/store/ui-store";

const toneStyles: Record<string, string> = {
  info: "bg-primary/15 text-primary-glow",
  warning: "bg-warning/15 text-warning",
  success: "bg-success/15 text-success",
  danger: "bg-danger/15 text-danger",
};

export function Navbar() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] border-sidebar-border bg-sidebar p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 lg:hidden">
          <span className="font-display text-sm font-semibold">NetworkIQ</span>
        </Link>

        <div className="relative ml-auto hidden max-w-md flex-1 items-center lg:ml-0 lg:flex">
          <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" aria-hidden />
          <input
            type="search"
            aria-label="Global search"
            placeholder="Search SKUs, warehouses, transfers…"
            className="h-10 w-full rounded-xl border border-border bg-surface/60 pl-9 pr-16 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-ring/30"
          />
          <kbd className="pointer-events-none absolute right-3 hidden items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground xl:flex">
            <Command className="size-3" />K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="mr-1 hidden items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1.5 md:flex">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="text-[11px] font-medium text-muted-foreground">Plan v41 live</span>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-background" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <span className="text-[11px] text-muted-foreground">4 new</span>
              </div>
              <ul className="max-h-[320px] divide-y divide-border overflow-y-auto">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 px-4 py-3 transition-colors hover:bg-accent/40">
                    <span className={cn("mt-0.5 size-2 shrink-0 rounded-full", toneStyles[n.tone])} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    </div>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {mounted && theme === "dark" ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pl-1 pr-1 transition-colors hover:bg-accent/50 sm:pr-3"
                aria-label="Account menu"
              >
                <span className="grid size-8 place-items-center rounded-full bg-gradient-primary text-xs font-semibold text-primary-foreground">
                  {user?.initials ?? "NI"}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold leading-tight">{user?.name ?? "NetworkIQ"}</span>
                  <span className="block text-[10px] text-muted-foreground">{user?.title ?? "Supply Planner"}</span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email ?? "admin@networkiq.com"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <UserRound className="mr-2 size-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 size-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
