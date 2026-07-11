import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader, SectionCard } from "@/components/common/PageHeader";
import { aiConversations } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Lightbulb, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const Route = createFileRoute("/ai-assistant")({
  head: () => ({ meta: [{ title: "AI Assistant — Scholarly" }, { name: "description", content: "Smart homework helper powered by AI." }] }),
  component: AiPage,
});

const PROMPTS = [
  { label: "Explain this concept", icon: Lightbulb },
  { label: "Break down a problem", icon: BookOpen },
  { label: "Recommend practice", icon: GraduationCap },
];

function AiPage() {
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState(aiConversations);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const nextId = msgs.length + 1;
    setMsgs([
      ...msgs,
      { id: nextId, role: "user", text: text.trim() },
      { id: nextId + 1, role: "assistant", text: "Great question! Here's a quick way to think about it — let's break it into smaller steps and reason through each one. (Demo response.)" },
    ]);
    setText("");
  };

  return (
    <AppShell>
      <PageHeader
        title="Smart Homework Assistant"
        subtitle="Ask questions, break down problems, learn — never just get the answer."
        actions={<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"><Sparkles className="h-3 w-3" /> AI</span>}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {PROMPTS.map(p => (
          <button key={p.label} onClick={() => setText(p.label + ": ")} className="card-surface flex items-center gap-3 p-4 text-left hover:bg-accent/40">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><p.icon className="h-4 w-4" /></div>
            <span className="font-semibold">{p.label}</span>
          </button>
        ))}
      </div>

      <SectionCard padded={false}>
        <div className="flex min-h-[400px] flex-col">
          <div className="flex-1 space-y-3 p-4">
            {msgs.map(m => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-4 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-border/40 p-3">
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Ask about homework, a concept, or a formula…" maxLength={1000} />
            <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
          </form>
        </div>
      </SectionCard>
    </AppShell>
  );
}
