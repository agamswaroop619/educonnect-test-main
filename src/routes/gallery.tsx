import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { gallery } from "@/lib/mock-data";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/gallery")({
  head: () => ({ meta: [{ title: "Gallery — Scholarly" }, { name: "description", content: "Photos of school events and activities." }] }),
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <AppShell>
      <PageHeader title="Gallery" subtitle="Moments from school events" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map(g => (
          <a key={g.id} className="card-surface group relative block overflow-hidden">
            <img src={g.cover} alt={g.title} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute inset-x-4 bottom-4 text-white">
              <div className="text-lg font-black tracking-tight">{g.title}</div>
              <div className="flex items-center gap-1 text-xs opacity-90"><Camera className="h-3 w-3" />{g.count} photos</div>
            </div>
          </a>
        ))}
      </div>
    </AppShell>
  );
}
