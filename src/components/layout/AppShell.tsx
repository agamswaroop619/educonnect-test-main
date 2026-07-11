import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Menu, Bell, Search, LogOut,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import type React from "react";
import { cn } from "@/lib/utils";
import { student } from "@/lib/mock-data";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth, ROLE_LABELS } from "@/lib/auth-context";
import { NAV_GROUPS, MOBILE_TABS } from "@/lib/nav-groups";




function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  return (
    <nav className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5 px-2">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight">Scholarly</div>
          <div className="text-xs text-muted-foreground">{user ? ROLE_LABELS[user.role] + " Portal" : "Portal"}</div>
        </div>
      </Link>

      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </div>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/70 hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* Logout at bottom */}
      <div className="mt-auto pt-2 border-t border-border/40">
        {user && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold leading-tight">{user.name}</p>
              <p className="truncate text-[10px] leading-tight text-muted-foreground">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { logout(); onNavigate?.(); }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border/60 bg-sidebar lg:block">
        <SidebarNav />
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="grid h-10 w-10 place-items-center rounded-xl bg-card shadow-sm lg:hidden">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="hidden flex-1 max-w-md md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search anything…" className="h-10 rounded-xl border-transparent bg-card pl-9 shadow-sm" />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          <button className="relative grid h-10 w-10 place-items-center rounded-xl bg-card shadow-sm">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5 pr-3 shadow-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {user?.initials ?? student.initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold leading-tight">{user?.name ?? student.name}</div>
              <div className="text-[10px] leading-tight text-muted-foreground">
                {user ? ROLE_LABELS[user.role] : student.grade}
              </div>
            </div>
          </div>

          {/* Logout shortcut on top bar */}
          <button
            onClick={logout}
            title="Sign out"
            className="grid h-10 w-10 place-items-center rounded-xl bg-card shadow-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="px-4 pb-24 pt-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_TABS.map((tab) => (
            <MobileTab key={tab.to} to={tab.to} label={tab.label} Icon={tab.icon} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileTab({ to, label, Icon }: { to: string; label: string; Icon: React.ElementType }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div className={cn("grid h-8 w-8 place-items-center rounded-xl", active && "bg-primary/10")}>
        <Icon className="h-[18px] w-[18px]" />
      </div>
      {label}
    </Link>
  );
}
