"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Skeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What are my skill gaps?",
  "Which career path fits me best?",
  "What should I do this week?",
  "How can I improve my resume?",
];

const GREETING =
  "Hi — I’m CareerVerse Copilot. Ask about career fit, skill gaps, opportunities, resume improvements, interview prep, or what to do this week. I’ll use your profile context when available.";

function CopilotInner() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q") || searchParams.get("prefill") || "";
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Message[]>([{ role: "assistant", content: GREETING }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentPrefill = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log, busy]);

  async function send(textIn?: string, historyOverride?: Message[]) {
    const text = (textIn ?? message).trim();
    if (!text || busy) return;
    const base = historyOverride ?? log;
    const nextLog = [...base, { role: "user" as const, content: text }];
    setLog(nextLog);
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextLog.slice(0, -1).slice(-8),
        }),
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

  useEffect(() => {
    if (!prefill || sentPrefill.current) return;
    sentPrefill.current = true;
    void send(prefill, [{ role: "assistant", content: GREETING }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full flex-col overflow-x-hidden">
      <PageHeader
        title="AI Career Copilot"
        description="Full-page coaching chat grounded in your CareerVerse profile. Not a guarantee of outcomes."
        actions={<Badge tone="accent">AI assistant</Badge>}
      />

      <div className="mb-3 flex flex-wrap gap-2">
        {STARTERS.map((s) => (
          <Button key={s} type="button" size="sm" variant="outline" disabled={busy} onClick={() => void send(s)}>
            {s}
          </Button>
        ))}
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6">
          {log.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={
                m.role === "assistant"
                  ? "max-w-[90%] whitespace-pre-wrap rounded-2xl bg-muted px-4 py-3 text-sm"
                  : "ml-auto max-w-[90%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
              }
            >
              {m.content}
            </div>
          ))}
          {busy ? <p className="text-xs text-muted-foreground">Thinking with your profile…</p> : null}
          <div ref={bottomRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex gap-2 border-t border-border p-4"
        >
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

export default function CopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-72 w-full" />
        </div>
      }
    >
      <CopilotInner />
    </Suspense>
  );
}
