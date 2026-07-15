import { cn } from "@/lib/utils";
import { useInView, useCountUp } from "@/hooks/use-animate";

export function ProgressRing({
  value,
  size = 180,
  stroke = 14,
  label,
  sub,
  className,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;

  // Animate the ring value from 0 → actual value on enter
  const animatedValue = useCountUp(Math.min(100, Math.max(0, value)), 1400, inView);
  const offset = circ - (animatedValue / 100) * circ;

  // If label is a plain number-string, count it up too
  const isNumericLabel = label !== undefined && !isNaN(Number(label));
  const labelTarget = isNumericLabel ? Number(label) : 0;
  const animatedLabel = useCountUp(labelTarget, 1400, inView && isNumericLabel);

  const displayLabel = isNumericLabel ? String(animatedLabel) : label;

  return (
    <div
      ref={ref}
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={stroke}
          opacity={0.5}
        />
        {/* Progress arc — animates via offset change */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.05s linear" }}
        />
      </svg>

      {/* Centre label */}
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className={cn(
              "font-black italic tracking-tight transition-all duration-700",
              size >= 180 ? "text-4xl sm:text-5xl" : "text-3xl",
              inView ? "opacity-100 scale-100" : "opacity-0 scale-75"
            )}
          >
            {displayLabel ?? Math.round(animatedValue)}
          </div>
          {sub && (
            <div
              className={cn(
                "text-xs font-medium text-muted-foreground transition-all duration-700 delay-300",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              {sub}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
