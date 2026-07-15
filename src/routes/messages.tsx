import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard, StatCard } from "@/components/common/PageHeader";
import { messages } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Search, Mail, MailOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — EduConnect" }, { name: "description", content: "Real-time messaging with teachers and admin." }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const [activeId, setActiveId] = useState(messages[0].id);
  const [text, setText] = useState("");
  const active = messages.find(m => m.id === activeId)!;

  return (
    <AppShell>
      <PageHeader title="Messages" subtitle="Chat with teachers and school administration" />

      <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Unread" value={messages.filter(m => m.unread).length} icon={<Mail className="h-5 w-5" />} accent="primary" />
        <StatCard label="Total" value={messages.length} icon={<MailOpen className="h-5 w-5" />} />
        <StatCard label="Teachers" value="8" icon={<MailOpen className="h-5 w-5" />} accent="success" />
        <StatCard label="Groups" value="3" icon={<MailOpen className="h-5 w-5" />} accent="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <SectionCard padded={false} className="overflow-hidden">
          <div className="border-b border-border/40 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search conversations" className="pl-9" />
            </div>
          </div>
          <ul className="max-h-64 divide-y divide-border/30 overflow-y-auto lg:max-h-[520px]">
            {messages.map(m => (
              <li key={m.id}>
                <button
                  onClick={() => setActiveId(m.id)}
                  className={cn("flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-accent/40", activeId === m.id && "bg-accent/60")}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{m.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold">{m.from}</div>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{m.time}</span>
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{m.preview}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard padded={false} className="flex flex-col overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border/40 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{active.avatar}</div>
            <div className="min-w-0">
              <div className="font-bold">{active.from}</div>
              <div className="text-xs text-muted-foreground">{active.role} · {active.subject}</div>
            </div>
          </header>
          <div className="flex-1 space-y-3 p-4 min-h-[320px]">
            <Bubble who="them">{active.preview}</Bubble>
            <Bubble who="me">Thank you for the update! We'll ensure he practices more.</Bubble>
            <Bubble who="them">Great — I'll share additional worksheets tomorrow.</Bubble>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setText(""); }} className="flex items-center gap-2 border-t border-border/40 p-3">
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" maxLength={1000} />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </SectionCard>
      </div>
    </AppShell>
  );
}

function Bubble({ who, children }: { who: "me" | "them"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", who === "me" ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[75%] rounded-2xl px-4 py-2 text-sm", who === "me" ? "bg-primary text-primary-foreground" : "bg-muted")}>
        {children}
      </div>
    </div>
  );
}
