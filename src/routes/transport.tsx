import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { transport } from "@/lib/mock-data";
import { Bus, Phone, User, MapPin, Clock } from "lucide-react";
import { Pill } from "@/components/common/Pill";

export const Route = createFileRoute("/transport")({
  head: () => ({ meta: [{ title: "Transport — EduConnect" }, { name: "description", content: "Live bus tracking and route information." }] }),
  component: TransportPage,
});

function TransportPage() {
  return (
    <AppShell>
      <PageHeader title="Transport" subtitle={`Route ${transport.routeNo} · Live tracking`} actions={<Pill variant="success">{transport.status}</Pill>} />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Route" value={transport.routeNo} icon={<Bus className="h-5 w-5" />} accent="primary" />
        <StatCard label="ETA" value={transport.eta} icon={<Clock className="h-5 w-5" />} accent="success" />
        <StatCard label="Driver" value={transport.driver} icon={<User className="h-5 w-5" />} />
        <StatCard label="Attendant" value={transport.attendant} icon={<User className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <SectionCard title="Live Location" padded={false}>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-b-2xl bg-gradient-to-br from-primary/20 via-background to-accent/40">
            {/* Faux map */}
            <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full">
              <path d="M50 400 Q 200 300 300 350 T 550 200 T 750 100" stroke="var(--color-primary)" strokeWidth="6" strokeDasharray="10 8" fill="none" opacity="0.6" />
              {[[50,400],[200,320],[300,350],[550,200],[750,100]].map(([x,y], i) => (
                <circle key={i} cx={x} cy={y} r={i === 2 ? 14 : 8} fill="var(--color-primary)" />
              ))}
              <g transform="translate(300 350)">
                <circle r="22" fill="var(--color-primary)" opacity="0.25">
                  <animate attributeName="r" from="22" to="40" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle r="14" fill="var(--color-primary)" />
                <circle r="8" fill="white" />
              </g>
            </svg>
            <div className="absolute bottom-4 left-4 rounded-xl bg-card p-3 shadow-lg">
              <div className="text-xs font-semibold text-muted-foreground">Currently at</div>
              <div className="font-bold">Rosewood Apts</div>
              <div className="text-xs">ETA to school: {transport.eta}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Route Stops">
          <ol className="relative grid gap-3 border-l-2 border-border/60 pl-5">
            {transport.stops.map((s, i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[26px] top-1 grid h-4 w-4 place-items-center rounded-full ${s.passed ? "bg-primary" : "bg-muted border-2 border-border"}`}>
                  {s.passed && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </span>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="font-semibold">{s.name}</div>
                  <div className="ml-auto text-xs text-muted-foreground">{s.time}</div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 rounded-xl bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-primary" />
              <div className="font-semibold">Driver</div>
              <a href={`tel:${transport.driverPhone}`} className="ml-auto text-sm text-primary">{transport.driverPhone}</a>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Vehicle: {transport.vehicle}</div>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
