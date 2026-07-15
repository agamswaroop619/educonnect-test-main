import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { reports } from "@/lib/mock-data";
import { Pill } from "@/components/common/Pill";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Award, TrendingUp, Users, Star, ThumbsUp, MessageCircle } from "lucide-react";
import { useInView } from "@/hooks/use-animate";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Report Card — Scholarly" }, { name: "description", content: "Academic performance, grades and teacher remarks." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell>
      <PageHeader title="Report Card" subtitle="Term 4 · Academic performance & remarks" />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Overall Grade" value={reports.overallGrade} icon={<Award className="h-5 w-5" />} accent="primary" delay={0} />
        <StatCard label="CGPA" value={reports.cgpa} icon={<TrendingUp className="h-5 w-5" />} accent="success" delay={80} />
        <StatCard label="Class Rank" value={`#${reports.rank}`} hint={`of ${reports.totalStudents}`} icon={<Users className="h-5 w-5" />} delay={160} />
        <StatCard label="Top Subject" value="Maths" hint="92%" icon={<Star className="h-5 w-5" />} accent="warning" delay={240} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="CGPA Trend" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reports.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="term" tickLine={false} axisLine={false} />
                <YAxis domain={[7, 10]} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                <Line type="monotone" dataKey="cgpa" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 5, fill: "var(--color-primary)" }} isAnimationActive animationDuration={1200} animationEasing="ease-out" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Teacher Remarks">
          <div className="grid gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[oklch(0.5_0.15_155)]">
                <ThumbsUp className="h-4 w-4" /> Strengths
              </div>
              <ul className="grid gap-2">
                {reports.remarks.positive.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-[var(--color-success)]/10 p-3 text-sm animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[oklch(0.5_0.15_60)]">
                <MessageCircle className="h-4 w-4" /> Growth areas
              </div>
              <ul className="grid gap-2">
                {reports.remarks.constructive.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-lg bg-[var(--color-warning)]/15 p-3 text-sm animate-in fade-in slide-in-from-left-4"
                    style={{ animationDelay: `${(i + reports.remarks.positive.length) * 120}ms`, animationFillMode: "both" }}
                  >
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard title="Subject-wise Marks">
          <div className="grid gap-3">
            {reports.subjects.map((s, i) => (
              <SubjectMarksRow key={s.name} subject={s} index={i} />
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function SubjectMarksRow({ subject, index }: { subject: typeof reports.subjects[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-[120px_1fr_60px_auto] transition-all duration-600 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
    >
      <div className="font-bold sm:col-span-1">{subject.name}</div>
      <div className="col-span-2 sm:col-span-1">
        <div className="h-2 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000"
            style={{
              width: inView ? `${subject.marks}%` : "0%",
              transitionDelay: `${index * 80 + 300}ms`,
            }}
          />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{subject.remark}</div>
      </div>
      <div className="text-right text-xl font-black tabular-nums">{subject.marks}</div>
      <Pill variant="primary">{subject.grade}</Pill>
    </div>
  );
}
