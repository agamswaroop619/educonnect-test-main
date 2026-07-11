import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4", className)}>
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("card-surface", className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-border/40 px-5 py-4">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive";
}) {
  const accentBg = {
    primary: "bg-primary/10 text-primary",
    success: "bg-[var(--color-success)]/15 text-[var(--color-success-foreground)]",
    warning: "bg-[var(--color-warning)]/20 text-[var(--color-warning-foreground)]",
    destructive: "bg-destructive/10 text-destructive",
  }[accent];

  return (
    <div className="card-surface flex items-start gap-4 p-5">
      {icon && (
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", accentBg)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-black tracking-tight">{value}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-xl border border-dashed border-border p-10 text-center">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="font-semibold">{title}</div>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
