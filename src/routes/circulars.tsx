import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { circulars } from "@/lib/mock-data";
import { Pill } from "@/components/common/Pill";
import { Pin, Newspaper } from "lucide-react";

export const Route = createFileRoute("/circulars")({
  head: () => ({ meta: [{ title: "Circulars & News — EduConnect" }, { name: "description", content: "Official announcements and school updates." }] }),
  component: CircularsPage,
});

function CircularsPage() {
  const pinned = circulars.filter(c => c.pinned);
  const rest = circulars.filter(c => !c.pinned);

  return (
    <AppShell>
      <PageHeader title="Circulars & News" subtitle="Official school announcements" />

      {pinned.length > 0 && (
        <SectionCard title="Pinned" className="mb-4">
          <ul className="grid gap-3">
            {pinned.map(c => <CircularItem key={c.id} c={c} pinned />)}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Latest">
        <ul className="grid gap-3">
          {rest.map(c => <CircularItem key={c.id} c={c} />)}
        </ul>
      </SectionCard>
    </AppShell>
  );
}

function CircularItem({ c, pinned = false }: { c: typeof circulars[number]; pinned?: boolean }) {
  return (
    <li className="rounded-xl bg-muted/40 p-4">
      <div className="mb-1 flex items-center gap-2">
        {pinned ? <Pin className="h-4 w-4 text-primary" /> : <Newspaper className="h-4 w-4 text-muted-foreground" />}
        <div className="font-bold">{c.title}</div>
        <Pill variant="primary" className="ml-auto">{c.category}</Pill>
      </div>
      <p className="text-sm text-muted-foreground">{c.excerpt}</p>
      <div className="mt-2 text-xs text-muted-foreground">{c.date}</div>
    </li>
  );
}
