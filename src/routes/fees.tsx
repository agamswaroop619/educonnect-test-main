import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pill } from "@/components/common/Pill";
import { fees } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, Clock, CreditCard } from "lucide-react";

export const Route = createFileRoute("/fees")({
  head: () => ({ meta: [{ title: "Fees — Scholarly" }, { name: "description", content: "Fee structure and payment history." }] }),
  component: FeesPage,
});

type Txn = typeof fees.transactions[number];

const INR = (n: number) => "₹" + n.toLocaleString("en-IN");

function FeesPage() {
  const cols: Column<Txn>[] = [
    { key: "date", header: "Date", cell: (r) => r.date },
    { key: "label", header: "Description", cell: (r) => <span className="font-semibold">{r.label}</span> },
    { key: "id", header: "Ref", cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span>, hideOnMobile: true },
    { key: "method", header: "Method", cell: (r) => r.method, hideOnMobile: true },
    { key: "amount", header: "Amount", cell: (r) => <span className="font-bold tabular-nums">{INR(r.amount)}</span>, className: "text-right" },
    { key: "status", header: "Status", cell: (r) => <Pill variant="success">{r.status}</Pill> },
  ];

  const paidPct = Math.round((fees.paid / fees.totalAnnual) * 100);

  return (
    <AppShell>
      <PageHeader title="Fees" subtitle="Annual fee overview and payments" actions={<Button><CreditCard className="mr-1 h-4 w-4" />Pay Now</Button>} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Annual Fee" value={INR(fees.totalAnnual)} icon={<Wallet className="h-5 w-5" />} />
        <StatCard label="Paid" value={INR(fees.paid)} hint={`${paidPct}% cleared`} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" />
        <StatCard label="Due" value={INR(fees.due)} hint={`by ${fees.nextDueDate}`} icon={<Clock className="h-5 w-5" />} accent="warning" />
        <StatCard label="Next Payment" value={fees.nextDueDate} icon={<CreditCard className="h-5 w-5" />} accent="primary" />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Payment Progress">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-3xl font-black">{paidPct}%</div>
            <div className="text-sm text-muted-foreground">{INR(fees.paid)} / {INR(fees.totalAnnual)}</div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${paidPct}%` }} />
          </div>
        </SectionCard>
        <SectionCard title="Fee Structure">
          <ul className="grid gap-2">
            {fees.structure.map(s => (
              <li key={s.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                <span className="text-sm">{s.label}</span>
                <span className="font-bold tabular-nums">{INR(s.amount)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Transaction History" padded={false}>
        <div className="p-4"><DataTable columns={cols} rows={fees.transactions} /></div>
      </SectionCard>
    </AppShell>
  );
}
