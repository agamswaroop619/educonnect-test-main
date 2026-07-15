import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp, useInView } from "@/hooks/use-animate";

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
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
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
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <section
      ref={ref}
      className={cn(
        "card-surface transition-all duration-700",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5",
        className
      )}
    >
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

// ─── StatCard ────────────────────────────────────────────────────────────────

/**
 * Tries to parse a numeric value out of `value` so we can run count-up on it.
 * Returns { prefix, numeric, suffix } or null if no number found.
 */
function parseNumeric(value: ReactNode): { prefix: string; numeric: number; suffix: string } | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const str = String(value);
  // Match optional prefix, integer/float, optional suffix  e.g. "₹1,48,000" "#4" "92%" "8.7"
  const match = str.match(/^([^0-9]*)([0-9][0-9,.]*)(.*)$/);
  if (!match) return null;
  const numeric = parseFloat(match[2].replace(/,/g, ""));
  if (isNaN(numeric)) return null;
  return { prefix: match[1], numeric, suffix: match[3] };
}

function AnimatedValue({ value }: { value: ReactNode }) {
  const parsed = parseNumeric(value);
  const { ref, inView } = useInView<HTMLDivElement>();

  // Always call the hook — conditionally use it
  const counted = useCountUp(parsed?.numeric ?? 0, 1000, inView && parsed !== null);

  if (!parsed) {
    return (
      <div ref={ref} className="mt-1 text-2xl font-black tracking-tight">
        {value}
      </div>
    );
  }

  // Format the counted number the same way as the original (preserve decimals)
  const isDecimal = String(parsed.numeric).includes(".");
  const decimals = isDecimal ? (String(parsed.numeric).split(".")[1]?.length ?? 1) : 0;

  // For large numbers with commas (like INR amounts), format with locale
  const hasCommas = String(value).includes(",");
  let display: string;
  if (hasCommas) {
    display = counted.toLocaleString("en-IN");
  } else if (isDecimal && inView) {
    // Show one decimal during count-up for decimals
    display = (parsed.numeric * (counted / (parsed.numeric || 1))).toFixed(decimals);
  } else {
    display = String(counted);
  }

  return (
    <div ref={ref} className="mt-1 text-2xl font-black tracking-tight tabular-nums">
      {parsed.prefix}{display}{parsed.suffix}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = "primary",
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: "primary" | "success" | "warning" | "destructive";
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  const accentBg = {
    primary: "bg-primary/10 text-primary",
    success: "bg-[var(--color-success)]/15 text-[var(--color-success-foreground)]",
    warning: "bg-[var(--color-warning)]/20 text-[var(--color-warning-foreground)]",
    destructive: "bg-destructive/10 text-destructive",
  }[accent];

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "card-surface flex items-start gap-4 p-5 transition-all duration-700",
        inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      )}
    >
      {icon && (
        <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl", accentBg)}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <AnimatedValue value={value} />
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
