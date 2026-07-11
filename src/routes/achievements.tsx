import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { achievements } from "@/lib/mock-data";
import { Trophy, Award, Medal, Star } from "lucide-react";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Scholarly" }, { name: "description", content: "Milestones, awards and recognitions." }] }),
  component: AchievementsPage,
});

const ICON = { Academic: Trophy, Sports: Medal, Debate: Award, Discipline: Star } as const;

function AchievementsPage() {
  return (
    <AppShell>
      <PageHeader title="Achievements" subtitle="Milestones, awards and recognitions" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map(a => {
          const Icon = ICON[a.category as keyof typeof ICON] ?? Trophy;
          return (
            <SectionCard key={a.id}>
              <div className="grid gap-3 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.category} · {a.date}</div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </AppShell>
  );
}
