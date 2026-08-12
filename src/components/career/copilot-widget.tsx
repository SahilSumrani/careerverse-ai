"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/states";
import { Send, Sparkles, X } from "lucide-react";
import "@/styles/cv-product.css";

type Msg = { role: "user" | "assistant"; content: string };

export function CopilotWidget() {
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Career/resume coach only — ask about skill gaps, target roles, interviews, or what to do this week. Off-topic questions get a short redirect.",
    },
  ]);

  useEffect(() => {
    const q = searchParams.get("copilot");
    if (q) {
      setOpen(true);
      setMessage(q);
    }
  }, [searchParams]);

  async function send(textIn?: string) {
    const text = (textIn ?? message).trim();
    if (!text || busy) return;
    const next = [...log, { role: "user" as const, content: text }];
    setLog(next);
    setMessage("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: next.slice(0, -1).slice(-8),
        }),
      });
      const data = await res.json();
      setLog((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            res.status === 429
              ? data.error || "Daily Copilot limit reached. Try again tomorrow."
              : data.reply || data.error || "Unavailable right now.",
        },
      ]);
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
        className="fixed bottom-20 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_rgba(34,90,234,0.28)] transition hover:brightness-105 md:bottom-6"
        aria-label="Open AI Career Copilot"
      >
        <Sparkles className="h-4 w-4" />
        Copilot
      </button>
      {open ? (
        <div className="fixed inset-x-3 bottom-24 z-50 md:inset-auto md:bottom-20 md:right-4 md:w-[380px]">
          <div className="cv-shell flex h-[420px] flex-col overflow-hidden shadow-lg">
            <div className="cv-shell-inner flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border bg-white/80 px-4 py-3 backdrop-blur-sm">
                <div>
                  <p className="text-sm font-semibold">AI Career Copilot</p>
                  <p className="text-xs text-muted-foreground">Uses your profile when signed in</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link href="/copilot" className="px-2 text-xs font-medium text-primary hover:underline">
                    Full page
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close copilot">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                {busy && log.length <= 1 ? <Skeleton className="h-14 w-full" /> : null}
                {log.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={m.role === "assistant" ? "cv-msg cv-msg-assistant" : "cv-msg cv-msg-user"}
                  >
                    {m.content}
                  </div>
                ))}
                {busy ? (
                  <p className="text-xs text-muted-foreground">Thinking with your career context…</p>
                ) : null}
              </div>
              <div className="cv-composer">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What are my skill gaps?"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void send();
                  }}
                  aria-label="Copilot message"
                  className="border-border bg-white"
                />
                <Button onClick={() => void send()} disabled={busy || !message.trim()} aria-label="Send">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
