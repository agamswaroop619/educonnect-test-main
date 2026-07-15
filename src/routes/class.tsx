import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SectionCard } from "@/components/common/PageHeader";
import { Pill } from "@/components/common/Pill";
import { useAuth } from "@/lib/auth-context";
import {
  Users, BookOpen, ClipboardCheck, BarChart3, Trophy,
  Search, Filter, ChevronRight, Star, TrendingUp, TrendingDown,
  GraduationCap, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useInView, useCountUp } from "@/hooks/use-animate";

export const Route = createFileRoute("/class")({
  component: ClassPage,
});

// ─── Mock data ───────────────────────────────────────────────────────────────

const CLASS_INFO = {
  name: "Class 10 - Section B",
  teacher: "Ms. Priya Nair",
  subject: "Mathematics",
  room: "Room 204",
  strength: 42,
  schedule: "Mon / Wed / Fri  ·  08:00 – 08:45 AM",
};

const SUBJECTS = [
  { name: "Mathematics", teacher: "Ms. Priya Nair", periods: 6, avgScore: 84, color: "#4f5eff" },
  { name: "Physics", teacher: "Mr. Arun Verma", periods: 5, avgScore: 79, color: "#f97316" },
  { name: "Chemistry", teacher: "Ms. Kavita Rao", periods: 5, avgScore: 72, color: "#a855f7" },
  { name: "Biology", teacher: "Mr. D. K. Sharma", periods: 5, avgScore: 81, color: "#22c55e" },
  { name: "English", teacher: "Ms. Sunita Patel", periods: 4, avgScore: 88, color: "#ec4899" },
  { name: "History", teacher: "Mr. Ramesh Gupta", periods: 3, avgScore: 76, color: "#0ea5e9" },
];

interface Student {
  id: string;
  name: string;
  rollNo: number;
  attendance: number;
  cgpa: number;
  status: "excellent" | "good" | "average" | "needs-attention";
  trend: "up" | "down" | "stable";
  house: string;
  phone: string;
}

const STUDENTS: Student[] = [
  { id: "STU-1042", name: "Atam Swaroop", rollNo: 1, attendance: 92, cgpa: 8.7, status: "excellent", trend: "up", house: "Sapphire", phone: "+91 98100 22331" },
  { id: "STU-1043", name: "Riya Sharma", rollNo: 2, attendance: 98, cgpa: 9.2, status: "excellent", trend: "up", house: "Ruby", phone: "+91 98100 11223" },
  { id: "STU-1044", name: "Karan Mehta", rollNo: 3, attendance: 76, cgpa: 6.8, status: "needs-attention", trend: "down", house: "Emerald", phone: "+91 98100 33445" },
  { id: "STU-1045", name: "Pooja Verma", rollNo: 4, attendance: 89, cgpa: 7.9, status: "good", trend: "stable", house: "Sapphire", phone: "+91 98100 55667" },
  { id: "STU-1046", name: "Arjun Singh", rollNo: 5, attendance: 95, cgpa: 8.3, status: "excellent", trend: "up", house: "Ruby", phone: "+91 98100 77889" },
  { id: "STU-1047", name: "Sneha Pillai", rollNo: 6, attendance: 82, cgpa: 7.4, status: "average", trend: "stable", house: "Emerald", phone: "+91 98100 99001" },
  { id: "STU-1048", name: "Dev Kapoor", rollNo: 7, attendance: 71, cgpa: 6.2, status: "needs-attention", trend: "down", house: "Sapphire", phone: "+91 98100 12345" },
  { id: "STU-1049", name: "Ananya Nair", rollNo: 8, attendance: 94, cgpa: 8.9, status: "excellent", trend: "up", house: "Ruby", phone: "+91 98100 23456" },
  { id: "STU-1050", name: "Rohit Jain", rollNo: 9, attendance: 87, cgpa: 7.6, status: "good", trend: "up", house: "Emerald", phone: "+91 98100 34567" },
  { id: "STU-1051", name: "Meghna Tiwari", rollNo: 10, attendance: 91, cgpa: 8.1, status: "good", trend: "stable", house: "Sapphire", phone: "+91 98100 45678" },
  { id: "STU-1052", name: "Sahil Khan", rollNo: 11, attendance: 65, cgpa: 5.9, status: "needs-attention", trend: "down", house: "Ruby", phone: "+91 98100 56789" },
  { id: "STU-1053", name: "Divya Bose", rollNo: 12, attendance: 96, cgpa: 9.0, status: "excellent", trend: "up", house: "Emerald", phone: "+91 98100 67890" },
];

const STATUS_META: Record<Student["status"], { label: string; color: string; dot: string }> = {
  excellent:         { label: "Excellent",      color: "bg-emerald-100 text-emerald-700",  dot: "bg-emerald-500" },
  good:              { label: "Good",           color: "bg-blue-100 text-blue-700",        dot: "bg-blue-500"    },
  average:           { label: "Average",        color: "bg-yellow-100 text-yellow-700",    dot: "bg-yellow-500"  },
  "needs-attention": { label: "Needs Attention", color: "bg-red-100 text-red-700",          dot: "bg-red-500"    },
};

// ─── Component ────────────────────────────────────────────────────────────────

function ClassPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"students" | "subjects">("students");

  const filtered = STUDENTS.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.rollNo).includes(search);
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const avgAttendance = Math.round(STUDENTS.reduce((a, s) => a + s.attendance, 0) / STUDENTS.length);
  const avgCgpa = (STUDENTS.reduce((a, s) => a + s.cgpa, 0) / STUDENTS.length).toFixed(1);
  const needsAttention = STUDENTS.filter((s) => s.status === "needs-attention").length;
  const topRanker = [...STUDENTS].sort((a, b) => b.cgpa - a.cgpa)[0];

  // Role-aware message
  const roleGreeting =
    user?.role === "teacher"
      ? `Your class, ${CLASS_INFO.name}`
      : user?.role === "school_admin"
      ? `Overview — ${CLASS_INFO.name}`
      : `Class details — ${CLASS_INFO.name}`;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm font-medium italic text-foreground/60">{roleGreeting}</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{CLASS_INFO.name}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4" />{CLASS_INFO.teacher}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{CLASS_INFO.room}</span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{CLASS_INFO.schedule}</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Students" value={CLASS_INFO.strength} accent="primary" delay={0} />
        <StatCard icon={<ClipboardCheck className="h-5 w-5" />} label="Avg Attendance" value={`${avgAttendance}%`} accent="success" delay={80} />
        <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Class CGPA" value={avgCgpa} accent="primary" delay={160} />
        <StatCard icon={<AlertCircle className="h-5 w-5" />} label="Needs Attention" value={needsAttention} accent="warning" delay={240} />
      </div>

      {/* Top ranker + subjects overview */}
      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        {/* Top ranker card */}
        <div className="card-surface flex items-center gap-4 p-5">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-yellow-100 text-yellow-600">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Top Ranker</p>
            <p className="text-xl font-black tracking-tight">{topRanker.name}</p>
            <p className="text-sm text-muted-foreground">CGPA {topRanker.cgpa} · {topRanker.attendance}% attendance</p>
          </div>
        </div>

        {/* Quick subject scores */}
        <div className="card-surface p-5 lg:col-span-2">
          <p className="mb-3 text-sm font-semibold">Subject Avg. Scores</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
            {SUBJECTS.map((sub, i) => (
              <SubjectScoreRow key={sub.name} subject={sub} index={i} />
            ))}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-muted p-1 w-fit">
        {(["students", "subjects"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-all",
              activeTab === tab
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "students" && (
        <SectionCard
          title={`Students (${filtered.length})`}
          action={
            <div className="flex items-center gap-2">
              {/* Status filter */}
              <div className="relative">
                <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background pl-7 pr-2 text-xs font-medium outline-none"
                >
                  <option value="all">All</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="average">Average</option>
                  <option value="needs-attention">Needs Attention</option>
                </select>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-8 rounded-lg border border-input bg-background pl-7 pr-3 text-xs outline-none w-32"
                />
              </div>
            </div>
          }
        >
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  {["#", "Name", "House", "Attendance", "CGPA", "Trend", "Status", ""].map((h) => (
                    <th key={h} className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground first:pl-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((student, idx) => {
                  const meta = STATUS_META[student.status];
                  return (
                    <tr
                      key={student.id}
                      className={cn("border-b border-border/30 transition-colors hover:bg-accent/40", idx % 2 === 0 ? "" : "bg-muted/20")}
                    >
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{student.rollNo}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold leading-tight">{student.name}</p>
                            <p className="text-[11px] text-muted-foreground">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-xs text-muted-foreground">{student.house}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full", student.attendance >= 85 ? "bg-emerald-500" : student.attendance >= 75 ? "bg-yellow-500" : "bg-red-500")}
                              style={{ width: `${student.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{student.attendance}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 font-bold">{student.cgpa}</td>
                      <td className="py-3 pr-4">
                        {student.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                        {student.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                        {student.trend === "stable" && <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", meta.color)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3">
                        <button className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-3 sm:hidden">
            {filtered.map((student) => {
              const meta = STATUS_META[student.status];
              return (
                <div key={student.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {student.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-sm">{student.name}</p>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.color)}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Roll {student.rollNo}</span>
                      <span>Att. {student.attendance}%</span>
                      <span className="font-semibold text-foreground">CGPA {student.cgpa}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No students match your search.
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "subjects" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((sub, i) => (
            <SubjectTabCard key={sub.name} subject={sub} index={i} />
          ))}
        </div>
      )}
    </AppShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SubjectScoreRow({ subject, index }: { subject: typeof SUBJECTS[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const counted = useCountUp(subject.avgScore, 900, inView);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 60}ms` }}
      className={`flex items-center gap-2 transition-all duration-500 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}`}
    >
      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: subject.color }} />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">{subject.name}</span>
      <span className="shrink-0 text-sm font-bold tabular-nums">{counted}</span>
    </div>
  );
}

function SubjectTabCard({ subject, index }: { subject: typeof SUBJECTS[number]; index: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 80}ms` }}
      className={cn(
        "card-surface p-5 transition-all duration-600",
        inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <div className="h-3 w-3 rounded-full mb-2" style={{ background: subject.color }} />
          <p className="text-lg font-bold leading-tight">{subject.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{subject.teacher}</p>
        </div>
        <span className="text-2xl font-black" style={{ color: subject.color }}>{subject.avgScore}</span>
      </div>

      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>Class average</span>
        <span>{subject.avgScore} / 100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: inView ? `${subject.avgScore}%` : "0%",
            background: subject.color,
            transitionDelay: `${index * 80 + 300}ms`,
          }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span>{subject.periods} periods / week</span>
        </div>
        <span className={cn(
          "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
          subject.avgScore >= 85 ? "bg-emerald-100 text-emerald-700" :
          subject.avgScore >= 75 ? "bg-blue-100 text-blue-700" :
          "bg-yellow-100 text-yellow-700"
        )}>
          <Star className="h-3 w-3" />
          {subject.avgScore >= 85 ? "Excellent" : subject.avgScore >= 75 ? "Good" : "Average"}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, accent, delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "primary" | "success" | "warning" | "danger";
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const colors = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-orange-100 text-orange-600",
    danger: "bg-red-100 text-red-600",
  };

  // Parse numeric value for count-up
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const isNumeric = !isNaN(numericValue);
  const suffix = typeof value === "string" ? value.replace(/[0-9.,]/g, "") : "";
  const counted = useCountUp(isNumeric ? numericValue : 0, 1000, inView && isNumeric);
  const isDecimal = String(value).includes(".");
  const displayValue = isNumeric
    ? `${isDecimal ? counted.toFixed(1) : counted}${suffix}`
    : value;

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "card-surface flex items-center gap-4 p-5 transition-all duration-700",
        inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
      )}
    >
      <div className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl", colors[accent])}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-2xl font-black tracking-tight leading-none mt-0.5 tabular-nums">{displayValue}</p>
      </div>
    </div>
  );
}
