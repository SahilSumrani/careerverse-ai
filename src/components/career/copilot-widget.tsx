"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Sparkles, X } from "lucide-react";

export function CopilotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Ask about career fit, skill gaps, opportunities, resume improvements, or what to do this week.",
    },
  ]);

  useEffect(() => {
    if (!open) return;
  }, [open]);

  async function send() {
    if (!message.trim() || busy) return;
    const next = [...log, { role: "user" as const, content: message.trim() }];
    setLog(next);
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: next[next.length - 1].content }),
      });
      const data = await res.json();
      setLog((prev) => [...prev, { role: "assistant", content: data.reply || data.error || "Unavailable right now." }]);
    } catch {
      setLog((prev) => [...prev, { role: "assistant", content: "Copilot is temporarily unavailable." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg md:bottom-6"
        aria-label="Open AI Career Copilot"
      >
        <Sparkles className="h-4 w-4" />
        Copilot
      </button>
      {open ? (
        <div className="fixed inset-x-3 bottom-24 z-50 md:inset-auto md:bottom-20 md:right-4 md:w-[380px]">
          <Card className="flex h-[420px] flex-col p-0 overflow-hidden shadow-md">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">AI Career Copilot</p>
                <p className="text-xs text-muted-foreground">Uses your profile context when signed in</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close copilot">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {log.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={
                    m.role === "assistant"
                      ? "rounded-xl bg-muted px-3 py-2 text-sm"
                      : "ml-8 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
                  }
                >
                  {m.content}
                </div>
              ))}
              {busy ? <p className="text-xs text-muted-foreground">Thinking with your career context…</p> : null}
            </div>
            <div className="flex gap-2 border-t border-border p-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What should I do this week?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
                aria-label="Copilot message"
              />
              <Button onClick={() => void send()} disabled={busy}>
                Send
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
