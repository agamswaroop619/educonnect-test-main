import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pill } from "@/components/common/Pill";
import { homework } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, Clock, AlertCircle, Download } from "lucide-react";

export const Route = createFileRoute("/homework")({
  head: () => ({ meta: [{ title: "Homework — Scholarly" }, { name: "description", content: "Homework, resources and submissions." }] }),
  component: HomeworkPage,
});

type HW = typeof homework[number];

function HomeworkPage() {
  const pending = homework.filter(h => h.status === "pending").length;
  const submitted = homework.filter(h => h.status === "submitted").length;
  const overdue = homework.filter(h => h.status === "overdue").length;

  const cols: Column<HW>[] = [
    { key: "subject", header: "Subject", cell: (r) => <span className="font-semibold">{r.subject}</span> },
    { key: "title", header: "Assignment", cell: (r) => <span>{r.title}</span> },
    { key: "assigned", header: "Assigned", cell: (r) => <span className="text-muted-foreground">{r.assigned}</span>, hideOnMobile: true },
    { key: "due", header: "Due", cell: (r) => <span>{r.due}</span> },
    { key: "status", header: "Status", cell: (r) => (
      <Pill variant={r.status === "graded" ? "success" : r.status === "submitted" ? "primary" : r.status === "overdue" ? "danger" : "warning"}>
        {r.status}{"grade" in r && r.grade ? ` · ${r.grade}` : ""}
      </Pill>
    )},
    { key: "actions", header: "", cell: (r) => (
      <div className="flex justify-end gap-2">
        {r.resources > 0 && <Button size="sm" variant="outline" className="h-8"><Download className="h-3.5 w-3.5" />{r.resources}</Button>}
        <Button size="sm" className="h-8">Open</Button>
      </div>
    ), className: "text-right" },
  ];

  return (
    <AppShell>
      <PageHeader title="Homework" subtitle="Assignments, resources and submissions" actions={<Button>New Submission</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Assigned" value={homework.length} icon={<BookOpen className="h-5 w-5" />} delay={0} />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-5 w-5" />} accent="warning" delay={80} />
        <StatCard label="Submitted" value={submitted} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" delay={160} />
        <StatCard label="Overdue" value={overdue} icon={<AlertCircle className="h-5 w-5" />} accent="destructive" delay={240} />
      </div>
      <SectionCard title="All Homework" padded={false}>
        <div className="p-4">
          <DataTable columns={cols} rows={homework} />
        </div>
      </SectionCard>
    </AppShell>
  );
}
