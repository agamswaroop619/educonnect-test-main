import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { student, parent } from "@/lib/mock-data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BadgeCheck, Mail, Phone, MapPin, Calendar, Droplet, Home } from "lucide-react";
import { Pill } from "@/components/common/Pill";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — EduConnect" }, { name: "description", content: "Student and parent profile." }] }),
  component: ProfilePage,
});

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate font-semibold">{value}</div>
      </div>
    </div>
  );
}

function ProfilePage() {
  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Student and guardian information" />

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard className="lg:col-span-1">
          <div className="grid place-items-center gap-3 text-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-2xl font-black text-primary-foreground">{student.initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-2xl font-black tracking-tight">{student.name}</div>
              <div className="text-sm text-muted-foreground">{student.grade}</div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Pill variant="primary">Roll {student.rollNo}</Pill>
              <Pill variant="success">Verified</Pill>
              <Pill>House: {student.house}</Pill>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Student Details" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Row icon={<BadgeCheck className="h-4 w-4" />} label="Admission No" value={student.admissionNo} />
            <Row icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={student.dob} />
            <Row icon={<Droplet className="h-4 w-4" />} label="Blood Group" value={student.bloodGroup} />
            <Row icon={<Home className="h-4 w-4" />} label="House" value={student.house} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={student.email} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={student.phone} />
            <div className="sm:col-span-2">
              <Row icon={<MapPin className="h-4 w-4" />} label="Address" value={student.address} />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Guardian" className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Row icon={<BadgeCheck className="h-4 w-4" />} label={parent.relation} value={parent.name} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={parent.email} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={parent.phone} />
            <Row icon={<BadgeCheck className="h-4 w-4" />} label="Occupation" value={parent.occupation} />
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
