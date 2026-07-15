import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProgressRing } from "@/components/common/ProgressRing";
import { SubjectCard } from "@/components/common/SubjectCard";
import { SectionCard, StatCard } from "@/components/common/PageHeader";
import { StatusDot, Pill } from "@/components/common/Pill";
import { student, subjects, todaysTasks, attendanceSummary, messages, circulars } from "@/lib/mock-data";
import { Hand, Calendar, Music, CheckCircle2, TrendingUp, Trophy, MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useInView } from "@/hooks/use-animate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `Home — ${student.name} | Scholarly` },
      { name: "description", content: "Dashboard overview: attendance, today's tasks, subjects and school updates." },
    ],
  }),
  component: HomePage,
});

function WelcomeBanner() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`mb-8 flex flex-col gap-1 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
    >
      <div className="flex items-center gap-2 text-lg font-medium italic text-foreground/70">
        Welcome <Hand className="h-5 w-5 text-[oklch(0.75_0.15_60)]" />
      </div>
      <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{student.name}</h1>
      <p className="text-sm text-muted-foreground">{student.grade} · Roll No {student.rollNo}</p>
    </div>
  );
}

function HomePage() {
  return (
    <AppShell>
      {/* Welcome */}
      <WelcomeBanner />

      {/* Hero grid — reference-style: small icon, subject card, ring, subject card, small icon */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-[auto_1fr_auto_1fr_auto] lg:items-center">
        <div className="hidden lg:block">
          <SubjectCard subject={subjects[3]} size="sm" index={0} />
        </div>
        <SubjectCard subject={subjects[0]} size="lg" index={1} />
        <div className="col-span-2 flex justify-center py-2 sm:col-span-4 lg:col-span-1">
          <div className="card-surface grid place-items-center p-6">
            <ProgressRing value={100 - (student.daysLeft / 200) * 100} label={String(student.daysLeft)} sub="Days Left" size={200} />
          </div>
        </div>
        <SubjectCard subject={subjects[1]} size="lg" index={2} />
        <div className="hidden lg:block">
          <SubjectCard subject={subjects[2]} size="sm" index={3} />
        </div>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Attendance" value={`${student.attendancePct}%`} hint={`${attendanceSummary.streak} day streak`} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" delay={0} />
        <StatCard label="CGPA" value={student.cgpa} hint="Term 4" icon={<TrendingUp className="h-5 w-5" />} accent="primary" delay={80} />
        <StatCard label="Pending Tasks" value={todaysTasks.filter(t => t.status === "pending").length} hint="Due today" icon={<Calendar className="h-5 w-5" />} accent="warning" delay={160} />
        <StatCard label="Awards" value="12" hint="This year" icon={<Trophy className="h-5 w-5" />} accent="primary" delay={240} />
      </div>

      {/* Bottom row: calendar, tasks, currently playing */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="December 2016" className="lg:col-span-1">
          <MiniCalendar />
        </SectionCard>

        <SectionCard title="Tasks Scheduled for Today" action={<Link to="/homework" className="text-xs font-semibold text-primary">View all</Link>} className="lg:col-span-1">
          <ul className="grid gap-3">
            {todaysTasks.slice(0, 6).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <StatusDot variant={t.status === "overdue" ? "danger" : "warning"} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.title}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{t.due}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Currently Playing" className="lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-foreground text-background">
              <Music className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xl font-black tracking-tight">Lost Sky — Fearless</div>
              <div className="mt-2 h-1.5 rounded-full bg-muted">
                <div className="h-full w-3/5 rounded-full bg-primary" />
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>1:42</span><span>2:48</span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Second row: messages + circulars */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Latest Messages" action={<Link to="/messages" className="text-xs font-semibold text-primary">Open inbox</Link>}>
          <ul className="grid gap-4">
            {messages.slice(0, 4).map((m) => (
              <li key={m.id} className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {m.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{m.from}</div>
                    {m.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{m.time}</span>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{m.preview}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Circulars & News" action={<Link to="/circulars" className="text-xs font-semibold text-primary">See all</Link>}>
          <ul className="grid gap-4">
            {circulars.slice(0, 4).map((c) => (
              <li key={c.id} className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold">{c.title}</div>
                    <Pill variant="primary" className="shrink-0">{c.category}</Pill>
                  </div>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{c.excerpt}</p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function MiniCalendar() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = 8;
  const dow = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {dow.map((d, i) => <div key={i}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {days.map((d) => (
          <div
            key={d}
            className={`grid h-8 place-items-center rounded-lg ${d === today ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent"}`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
