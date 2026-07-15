import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { timetable } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/timetable")({
  head: () => ({ meta: [{ title: "Timetable — EduConnect" }, { name: "description", content: "Weekly class schedule." }] }),
  component: TimetablePage,
});

const COLORS: Record<string, string> = {
  Maths: "#4f5eff", Physics: "#f97316", Chemistry: "#a855f7", Biology: "#22c55e",
  English: "#ec4899", History: "#0ea5e9", PE: "#eab308", Art: "#f43f5e", Library: "#64748b", "-": "transparent",
};

function TimetablePage() {
  const [dayIdx, setDayIdx] = useState(0);

  return (
    <AppShell>
      <PageHeader title="Timetable" subtitle="Weekly schedule at a glance" />

      {/* Mobile day tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
        {timetable.days.map((d, i) => (
          <button
            key={d}
            onClick={() => setDayIdx(i)}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold", i === dayIdx ? "bg-primary text-primary-foreground" : "bg-card")}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Mobile view */}
      <SectionCard title={`${timetable.days[dayIdx]} · Today`} className="lg:hidden">
        <ul className="grid gap-3">
          {timetable.periods.map((p, i) => {
            const s = p.slots[dayIdx];
            return (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">{p.time}</div>
                <div className="h-8 w-1 rounded-full" style={{ backgroundColor: COLORS[s] ?? "#64748b" }} />
                <div className="font-semibold">{s}</div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      {/* Desktop grid */}
      <SectionCard padded={false} className="hidden lg:block">
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-32 py-3 text-left text-xs font-semibold uppercase text-muted-foreground">Time</th>
                {timetable.days.map(d => <th key={d} className="p-2 text-left text-xs font-semibold uppercase text-muted-foreground">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {timetable.periods.map((p, i) => (
                <tr key={i} className="border-t border-border/40">
                  <td className="py-3 pr-4 text-xs font-semibold text-muted-foreground">{p.time}</td>
                  {p.slots.map((s, j) => (
                    <td key={j} className="p-1.5">
                      <div className="rounded-lg px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: COLORS[s] ?? "transparent", color: s === "-" ? "var(--color-muted-foreground)" : "white" }}>
                        {s}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
