import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, Shield, Palette, Globe } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Scholarly" }, { name: "description", content: "Preferences and account settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <PageHeader title="Settings" subtitle="Preferences and account" />
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={<span className="inline-flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</span>}>
          <div className="grid gap-4">
            {["Attendance alerts", "Homework reminders", "Fee reminders", "Circulars & news", "Transport delays"].map(l => (
              <div key={l} className="flex items-center justify-between">
                <Label>{l}</Label>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title={<span className="inline-flex items-center gap-2"><Shield className="h-4 w-4" /> Security</span>}>
          <form className="grid gap-3">
            <div className="grid gap-2"><Label>Current password</Label><Input type="password" /></div>
            <div className="grid gap-2"><Label>New password</Label><Input type="password" /></div>
            <div className="grid gap-2"><Label>Confirm password</Label><Input type="password" /></div>
            <Button className="w-fit">Update password</Button>
          </form>
        </SectionCard>

        <SectionCard title={<span className="inline-flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</span>}>
          <div className="grid gap-4">
            <div className="flex items-center justify-between"><Label>Compact mode</Label><Switch /></div>
            <div className="flex items-center justify-between"><Label>Reduce motion</Label><Switch /></div>
          </div>
        </SectionCard>

        <SectionCard title={<span className="inline-flex items-center gap-2"><Globe className="h-4 w-4" /> Language & Region</span>}>
          <div className="grid gap-2">
            <Label>Language</Label>
            <Input defaultValue="English (India)" />
            <Label className="mt-2">Time zone</Label>
            <Input defaultValue="Asia/Kolkata" />
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
