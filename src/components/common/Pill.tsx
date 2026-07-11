import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  neutral: "bg-muted text-foreground/80",
  primary: "bg-primary/10 text-primary",
  success: "bg-[var(--color-success)]/15 text-[oklch(0.35_0.1_155)]",
  warning: "bg-[var(--color-warning)]/25 text-[oklch(0.35_0.1_85)]",
  danger: "bg-destructive/10 text-destructive",
} as const;

export function Pill({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ variant = "neutral" }: { variant?: "success" | "warning" | "danger" | "neutral" }) {
  const color = {
    success: "bg-[var(--color-success)]",
    warning: "bg-[var(--color-warning)]",
    danger: "bg-destructive",
    neutral: "bg-muted-foreground/40",
  }[variant];
  return <span className={cn("inline-block h-2 w-2 rounded-full", color)} />;
}
