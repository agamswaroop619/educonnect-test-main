import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { library } from "@/lib/mock-data";
import { BookOpen, AlertTriangle, History } from "lucide-react";
import { Pill } from "@/components/common/Pill";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "Library — Scholarly" }, { name: "description", content: "Books issued, returned and overdue." }] }),
  component: LibraryPage,
});

type Row = { id: string; title: string; author: string; issued: string; due?: string; returned?: string; fine?: number };

function LibraryPage() {
  const issuedCols: Column<Row>[] = [
    { key: "title", header: "Book", cell: r => <div><div className="font-semibold">{r.title}</div><div className="text-xs text-muted-foreground">{r.author}</div></div> },
    { key: "issued", header: "Issued", cell: r => r.issued, hideOnMobile: true },
    { key: "due", header: "Due", cell: r => r.due },
    { key: "id", header: "Ref", cell: r => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>, hideOnMobile: true },
  ];
  const overdueCols: Column<Row>[] = [
    ...issuedCols,
    { key: "fine", header: "Fine", cell: r => <Pill variant="danger">₹{r.fine}</Pill> },
  ];
  const historyCols: Column<Row>[] = [
    { key: "title", header: "Book", cell: r => <div><div className="font-semibold">{r.title}</div><div className="text-xs text-muted-foreground">{r.author}</div></div> },
    { key: "issued", header: "Issued", cell: r => r.issued },
    { key: "returned", header: "Returned", cell: r => r.returned },
  ];

  return (
    <AppShell>
      <PageHeader title="Library" subtitle="Track issued books and reading history" />
      <div className="mb-6 grid grid-cols-3 gap-4">
        <StatCard label="Issued" value={library.issued.length} icon={<BookOpen className="h-5 w-5" />} accent="primary" />
        <StatCard label="Overdue" value={library.overdue.length} icon={<AlertTriangle className="h-5 w-5" />} accent="destructive" />
        <StatCard label="Read" value={library.history.length} icon={<History className="h-5 w-5" />} accent="success" />
      </div>

      <div className="grid gap-4">
        <SectionCard title="Currently Issued" padded={false}><div className="p-4"><DataTable columns={issuedCols} rows={library.issued} /></div></SectionCard>
        <SectionCard title="Overdue" padded={false}><div className="p-4"><DataTable columns={overdueCols} rows={library.overdue} empty="No overdue books" /></div></SectionCard>
        <SectionCard title="Reading History" padded={false}><div className="p-4"><DataTable columns={historyCols} rows={library.history} /></div></SectionCard>
      </div>
    </AppShell>
  );
}
