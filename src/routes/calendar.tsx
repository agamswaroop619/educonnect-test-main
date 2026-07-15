import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { events } from "@/lib/mock-data";
import { Pill } from "@/components/common/Pill";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  head: () => ({ meta: [{ title: "Calendar — EduConnect" }, { name: "description", content: "Upcoming holidays, exams and events." }] }),
  component: CalendarPage,
});

const VARIANTS = { Holiday: "warning", Exam: "danger", Event: "primary", Meeting: "success" } as const;

function CalendarPage() {
  return (
    <AppShell>
      <PageHeader title="School Calendar" subtitle="Holidays, exams and events" />
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SectionCard title="Upcoming">
          <ol className="relative grid gap-4 border-l-2 border-border/60 pl-6">
            {events.map(e => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[31px] top-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
                  <CalendarDays className="h-3 w-3" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-bold">{e.title}</div>
                  <Pill variant={VARIANTS[e.type as keyof typeof VARIANTS] ?? "neutral"}>{e.type}</Pill>
                </div>
                <div className="text-sm text-muted-foreground">{new Date(e.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              </li>
            ))}
          </ol>
        </SectionCard>
        <SectionCard title="This Month">
          <MonthGrid />
        </SectionCard>
      </div>
    </AppShell>
  );
}

function MonthGrid() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const eventDays = new Set([15, 19, 24]);
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-sm">
      {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} className="py-1 text-[10px] font-bold uppercase text-muted-foreground">{d}</div>)}
      {days.map(d => (
        <div key={d} className={`relative grid h-10 place-items-center rounded-lg ${eventDays.has(d) ? "bg-primary/10 font-bold text-primary" : "hover:bg-accent"}`}>
          {d}
          {eventDays.has(d) && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
        </div>
      ))}
    </div>
  );
}
