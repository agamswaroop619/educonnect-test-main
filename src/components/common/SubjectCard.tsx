import { cn } from "@/lib/utils";
import {
  Calculator, Dna, Atom, FlaskConical, BookOpen, Landmark, type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Subject } from "@/lib/mock-data";
import { useInView } from "@/hooks/use-animate";

const ICON: Record<string, LucideIcon> = {
  calculator: Calculator,
  dna: Dna,
  atom: Atom,
  "flask-conical": FlaskConical,
  "book-open": BookOpen,
  landmark: Landmark,
};

export function SubjectCard({
  subject,
  size = "md",
  index = 0,
}: {
  subject: Subject;
  size?: "sm" | "md" | "lg";
  /** Pass the card's index in a grid so cards stagger in */
  index?: number;
}) {
  const Icon = ICON[subject.icon] ?? BookOpen;
  const { ref, inView } = useInView<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      to="/courses"
      style={{ transitionDelay: `${index * 60}ms` }}
      className={cn(
        "card-surface group flex flex-col items-center gap-2 p-5 transition-all duration-600 hover:-translate-y-1 hover:shadow-[var(--shadow-card-lg)]",
        size === "sm" && "p-4",
        size === "lg" && "p-6",
        inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-2xl p-4 transition-transform duration-300 group-hover:scale-110",
        )}
        style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
      >
        <Icon className={cn(size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-9 w-9")} strokeWidth={1.5} />
      </div>
      <div className={cn("font-black tracking-tight", size === "lg" ? "text-2xl" : "text-lg")}>{subject.name}</div>
      <div className="text-center text-xs text-muted-foreground">
        {subject.chapters} Chapter{subject.chapters !== 1 && "s"}
        {subject.dpp ? ` | ${subject.dpp} DPP` : ""}
        {" | "}
        {subject.quizzes} Quiz
      </div>
    </Link>
  );
}
