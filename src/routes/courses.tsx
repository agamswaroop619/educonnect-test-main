import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { SubjectCard } from "@/components/common/SubjectCard";
import { subjects } from "@/lib/mock-data";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Courses — Scholarly" }, { name: "description", content: "All subjects, chapters and progress." }] }),
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <AppShell>
      <PageHeader title="Courses" subtitle="Track chapters, DPPs and quizzes across subjects" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {subjects.map((s) => <SubjectCard key={s.id} subject={s} size="sm" />)}
      </div>

      <SectionCard title="Progress by Subject">
        <div className="grid gap-5">
          {subjects.map((s) => (
            <div key={s.id} className="grid gap-2">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{s.name}</div>
                <div className="text-sm font-bold" style={{ color: s.color }}>{s.progress}%</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full transition-all" style={{ width: `${s.progress}%`, backgroundColor: s.color }} />
              </div>
              <div className="text-xs text-muted-foreground">{s.chapters} chapters · {s.quizzes} quizzes{s.dpp ? ` · ${s.dpp} DPP` : ""}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
