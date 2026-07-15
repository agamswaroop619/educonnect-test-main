import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { SubjectCard } from "@/components/common/SubjectCard";
import { subjects } from "@/lib/mock-data";
import { useInView } from "@/hooks/use-animate";

export const Route = createFileRoute("/courses")({
  head: () => ({ meta: [{ title: "Courses — EduConnect" }, { name: "description", content: "All subjects, chapters and progress." }] }),
  component: CoursesPage,
});

function SubjectProgressBar({ subject, index }: { subject: typeof subjects[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={`grid gap-2 transition-all duration-700 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold">{subject.name}</div>
        <div className="text-sm font-bold" style={{ color: subject.color }}>{subject.progress}%</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: inView ? `${subject.progress}%` : "0%",
            backgroundColor: subject.color,
            transitionDelay: `${index * 80 + 200}ms`,
          }}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        {subject.chapters} chapters · {subject.quizzes} quizzes{subject.dpp ? ` · ${subject.dpp} DPP` : ""}
      </div>
    </div>
  );
}

function CoursesPage() {
  return (
    <AppShell>
      <PageHeader title="Courses" subtitle="Track chapters, DPPs and quizzes across subjects" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {subjects.map((s, i) => <SubjectCard key={s.id} subject={s} size="sm" index={i} />)}
      </div>

      <SectionCard title="Progress by Subject">
        <div className="grid gap-5">
          {subjects.map((s, i) => (
            <SubjectProgressBar key={s.id} subject={s} index={i} />
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
