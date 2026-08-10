"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = { role: "user" | "assistant"; content: string };

export default function CopilotPage() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi — I’m CareerVerse Copilot. Ask about career fit, skill gaps, opportunities, resume improvements, interview prep, or what to do this week. I’ll use your profile context when available.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log, busy]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setLog((prev) => [...prev, { role: "user", content: text }]);
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setLog((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || data.error || "Copilot is unavailable right now." },
      ]);
    } catch {
      setLog((prev) => [...prev, { role: "assistant", content: "Copilot is temporarily unavailable." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="AI Career Copilot"
        description="Full-page coaching chat grounded in your CareerVerse profile. Not a guarantee of outcomes."
        actions={<Badge tone="accent">AI assistant</Badge>}
      />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
          {log.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "assistant"
                  ? "max-w-[90%] rounded-2xl bg-muted px-4 py-3 text-sm"
                  : "ml-auto max-w-[90%] rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
              }
            >
              {m.content}
            </div>
          ))}
          {busy ? <p className="text-xs text-muted-foreground">Thinking…</p> : null}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about your next career move…"
            disabled={busy}
            className="flex-1"
          />
          <Button type="submit" disabled={busy || !message.trim()}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
