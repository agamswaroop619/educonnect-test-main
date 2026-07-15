import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { ProgressRing } from "@/components/common/ProgressRing";
import { StatusDot, Pill } from "@/components/common/Pill";
import { attendanceSummary, student } from "@/lib/mock-data";
import { CheckCircle2, XCircle, CalendarOff, Flame } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/attendance")({
  head: () => ({ meta: [{ title: "Attendance — EduConnect" }, { name: "description", content: "Real-time attendance tracking with pattern analysis." }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const { present, absent, leave, total, streak, monthly, recent } = attendanceSummary;
  const pct = Math.round((present / total) * 100);

  return (
    <AppShell>
      <PageHeader title="Attendance" subtitle={`Overall presence for ${student.name}`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Overall" className="lg:col-span-1">
          <div className="flex flex-col items-center gap-4">
            <ProgressRing value={pct} label={`${pct}%`} sub="Present" size={200} />
            <div className="flex items-center gap-2 text-sm">
              <Flame className="h-4 w-4 text-[oklch(0.7_0.2_40)]" />
              <span className="font-semibold">{streak}-day streak</span>
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2 lg:grid-cols-3">
          <StatCard label="Present" value={present} hint={`of ${total}`} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" delay={0} />
          <StatCard label="Absent" value={absent} hint="This year" icon={<XCircle className="h-5 w-5" />} accent="destructive" delay={80} />
          <StatCard label="Leave" value={leave} hint="Approved" icon={<CalendarOff className="h-5 w-5" />} accent="warning" delay={160} />
          <SectionCard title="Monthly Trend" className="col-span-2 lg:col-span-3">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} domain={[70, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)" }} />
                  <Bar dataKey="pct" fill="var(--color-primary)" radius={[8, 8, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-4">
        <SectionCard title="Recent Days">
          <ul className="grid gap-2">
            {recent.map((r) => (
              <li key={r.date} className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusDot variant={r.status === "present" ? "success" : r.status === "leave" ? "warning" : "danger"} />
                  <div className="text-sm font-semibold">{new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</div>
                </div>
                <Pill variant={r.status === "present" ? "success" : r.status === "leave" ? "warning" : "danger"}>{r.status}</Pill>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
