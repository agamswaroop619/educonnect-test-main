import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pill } from "@/components/common/Pill";
import { leaves } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/leave")({
  head: () => ({ meta: [{ title: "Leave Application — Scholarly" }, { name: "description", content: "Apply and track student leave." }] }),
  component: LeavePage,
});

type Leave = typeof leaves[number];

function LeavePage() {
  const [open, setOpen] = useState(false);

  const cols: Column<Leave>[] = [
    { key: "from", header: "From", cell: r => r.from },
    { key: "to", header: "To", cell: r => r.to },
    { key: "reason", header: "Reason", cell: r => <span className="font-semibold">{r.reason}</span> },
    { key: "applied", header: "Applied on", cell: r => <span className="text-muted-foreground">{r.appliedOn}</span>, hideOnMobile: true },
    { key: "status", header: "Status", cell: r => <Pill variant={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warning"}>{r.status}</Pill> },
  ];

  const approved = leaves.filter(l => l.status === "approved").length;
  const pending = leaves.filter(l => l.status === "pending").length;
  const rejected = leaves.filter(l => l.status === "rejected").length;

  return (
    <AppShell>
      <PageHeader title="Leave Application" subtitle="Submit and track leave requests" actions={<Button onClick={() => setOpen(v => !v)}>{open ? "Cancel" : "Apply Leave"}</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total" value={leaves.length} icon={<FileText className="h-5 w-5" />} />
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <StatCard label="Pending" value={pending} icon={<Clock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Rejected" value={rejected} icon={<XCircle className="h-5 w-5" />} accent="destructive" />
      </div>

      {open && (
        <SectionCard title="New Leave Request" className="mb-4">
          <form
            onSubmit={(e) => { e.preventDefault(); toast.success("Leave request submitted"); setOpen(false); }}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="grid gap-2">
              <Label>From</Label>
              <Input type="date" required />
            </div>
            <div className="grid gap-2">
              <Label>To</Label>
              <Input type="date" required />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Reason</Label>
              <Textarea rows={3} placeholder="Briefly describe the reason" required maxLength={500} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Submit request</Button>
            </div>
          </form>
        </SectionCard>
      )}

      <SectionCard title="Leave History" padded={false}>
        <div className="p-4"><DataTable columns={cols} rows={leaves} /></div>
      </SectionCard>
    </AppShell>
  );
}
