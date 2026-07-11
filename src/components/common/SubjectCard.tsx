import { cn } from "@/lib/utils";
import {
  Calculator, Dna, Atom, FlaskConical, BookOpen, Landmark, type LucideIcon,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Subject } from "@/lib/mock-data";

const ICON: Record<string, LucideIcon> = {
  calculator: Calculator,
  dna: Dna,
  atom: Atom,
  "flask-conical": FlaskConical,
  "book-open": BookOpen,
  landmark: Landmark,
};

export function SubjectCard({ subject, size = "md" }: { subject: Subject; size?: "sm" | "md" | "lg" }) {
  const Icon = ICON[subject.icon] ?? BookOpen;
  return (
    <Link
      to="/courses"
      className={cn(
        "card-surface group flex flex-col items-center gap-2 p-5 transition-transform hover:-translate-y-0.5",
        size === "sm" && "p-4",
        size === "lg" && "p-6"
      )}
    >
      <div
        className="grid place-items-center rounded-2xl p-4"
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
