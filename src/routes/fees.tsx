import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { Pill } from "@/components/common/Pill";
import { fees } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, Clock, CreditCard } from "lucide-react";
import { useInView } from "@/hooks/use-animate";

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
        <StatCard label="Annual Fee" value={INR(fees.totalAnnual)} icon={<Wallet className="h-5 w-5" />} delay={0} />
        <StatCard label="Paid" value={INR(fees.paid)} hint={`${paidPct}% cleared`} icon={<CheckCircle2 className="h-5 w-5" />} accent="success" delay={80} />
        <StatCard label="Due" value={INR(fees.due)} hint={`by ${fees.nextDueDate}`} icon={<Clock className="h-5 w-5" />} accent="warning" delay={160} />
        <StatCard label="Next Payment" value={fees.nextDueDate} icon={<CreditCard className="h-5 w-5" />} accent="primary" delay={240} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <PaymentProgressCard paidPct={paidPct} paid={fees.paid} total={fees.totalAnnual} />
        <SectionCard title="Fee Structure">
          <ul className="grid gap-2">
            {fees.structure.map((s, i) => (
              <FeeStructureRow key={s.label} label={s.label} amount={INR(s.amount)} index={i} />
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

function PaymentProgressCard({ paidPct, paid, total }: { paidPct: number; paid: number; total: number }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <SectionCard title="Payment Progress">
      <div ref={ref}>
        <div className="mb-3 flex items-baseline justify-between">
          <div
            className={`text-3xl font-black tabular-nums transition-all duration-700 ${inView ? "opacity-100" : "opacity-0"}`}
          >
            {paidPct}%
          </div>
          <div className="text-sm text-muted-foreground">{INR(paid)} / {INR(total)}</div>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1200 ease-out"
            style={{ width: inView ? `${paidPct}%` : "0%", transitionDelay: "200ms" }}
          />
        </div>
      </div>
    </SectionCard>
  );
}

function FeeStructureRow({ label, amount, index }: { label: string; amount: string; index: number }) {
  const { ref, inView } = useInView<HTMLLIElement>();
  return (
    <li
      ref={ref}
      style={{ transitionDelay: `${index * 70}ms` }}
      className={`flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 transition-all duration-500 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
    >
      <span className="text-sm">{label}</span>
      <span className="font-bold tabular-nums">{amount}</span>
    </li>
  );
}
