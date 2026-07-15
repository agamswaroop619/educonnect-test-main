import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { achievements } from "@/lib/mock-data";
import { Trophy, Award, Medal, Star } from "lucide-react";
import { useInView } from "@/hooks/use-animate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({ meta: [{ title: "Achievements — Scholarly" }, { name: "description", content: "Milestones, awards and recognitions." }] }),
  component: AchievementsPage,
});

const ICON = { Academic: Trophy, Sports: Medal, Debate: Award, Discipline: Star } as const;

function AchievementCard({ achievement, index }: { achievement: typeof achievements[number]; index: number }) {
  const Icon = ICON[achievement.category as keyof typeof ICON] ?? Trophy;
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${index * 100}ms` }}
      className={cn(
        "transition-all duration-700",
        inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
      )}
    >
      <SectionCard>
        <div className="grid gap-3 text-center">
          <div
            className={cn(
              "mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500",
              inView ? "scale-100 rotate-0" : "scale-50 -rotate-12"
            )}
            style={{ transitionDelay: `${index * 100 + 200}ms` }}
          >
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">{achievement.title}</div>
            <div className="text-xs text-muted-foreground">{achievement.category} · {achievement.date}</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function AchievementsPage() {
  return (
    <AppShell>
      <PageHeader title="Achievements" subtitle="Milestones, awards and recognitions" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {achievements.map((a, i) => (
          <AchievementCard key={a.id} achievement={a} index={i} />
        ))}
      </div>
    </AppShell>
  );
}
