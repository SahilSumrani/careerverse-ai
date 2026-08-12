"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, Skeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import "@/styles/cv-product.css";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What are my skill gaps?",
  "Which career path fits me best?",
  "What should I do this week?",
  "How can I improve my resume?",
];

const GREETING =
  "Hi — I’m CareerVerse Copilot. I only help with careers, resumes, skills, interviews, and job search using your profile. Ask what to do today or this week.";

const COACHING_CARDS = [
  { t: "Skill gaps", d: "See what to learn next for your target role." },
  { t: "Interview prep", d: "Practice questions tailored to your profile." },
  { t: "Resume tips", d: "Tighten bullets for stronger ATS-friendly clarity." },
  { t: "This week", d: "Get a short action list you can finish in 7 days." },
];

const MAX_CHARS = 300;

function CopilotInner() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("q") || searchParams.get("prefill") || "";
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState(40);
  const [log, setLog] = useState<Message[]>([{ role: "assistant", content: GREETING }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sentPrefill = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log, busy]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/ai/chat");
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data.remaining === "number") setRemaining(data.remaining);
        if (typeof data.limit === "number") setLimit(data.limit);
      } catch {
        // ignore
      }
    })();
  }, []);

  async function send(textIn?: string, historyOverride?: Message[]) {
    const text = (textIn ?? message).trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    if (remaining === 0) {
      setLog((prev) => [
        ...prev,
        { role: "assistant", content: `Daily Copilot limit reached (${limit}/day). Try again tomorrow.` },
      ]);
      return;
    }
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
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (typeof data.limit === "number") setLimit(data.limit);
      setLog((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            res.status === 429
              ? data.error || "Daily Copilot limit reached. Try again tomorrow."
              : data.reply || data.error || "Copilot is unavailable right now.",
        },
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
    void send(prefill.slice(0, MAX_CHARS), [{ role: "assistant", content: GREETING }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const showEmpty = log.length <= 1 && !busy;
  const charsLeft = MAX_CHARS - message.length;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-6xl flex-col overflow-x-hidden">
      <PageHeader
        title="AI Career Copilot"
        description="Full-page coaching chat grounded in your CareerVerse profile. Not a guarantee of outcomes."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">Career & resume only</Badge>
            {remaining != null ? (
              <Badge tone="info">
                {remaining}/{limit} messages today
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="cv-shell flex min-h-0 flex-1 flex-col">
        <div className="cv-shell-inner flex min-h-0 flex-1 flex-col">
          {!showEmpty ? (
            <div className="flex flex-wrap gap-2 border-b border-border/70 bg-white/70 px-4 py-3 backdrop-blur-sm md:px-5">
              {STARTERS.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy || remaining === 0}
                  onClick={() => void send(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5 md:px-6">
            {showEmpty ? (
              <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 py-6 text-center">
                <div className="cv-msg cv-msg-assistant max-w-lg text-left">{GREETING}</div>
                <p className="text-sm text-muted-foreground">Start with a coaching focus:</p>
                <div className="cv-stagger grid w-full gap-2 text-left sm:grid-cols-2">
                  {COACHING_CARDS.map((card) => (
                    <button
                      key={card.t}
                      type="button"
                      disabled={busy || remaining === 0}
                      onClick={() => void send(`Help me with: ${card.t.toLowerCase()}`)}
                      className="cv-panel cv-panel-interactive p-4 text-left"
                    >
                      <p className="text-sm font-semibold">{card.t}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.d}</p>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {STARTERS.map((s) => (
                    <Button
                      key={`empty-${s}`}
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy || remaining === 0}
                      onClick={() => void send(s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              log.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={m.role === "assistant" ? "cv-msg cv-msg-assistant" : "cv-msg cv-msg-user"}
                >
                  {m.content}
                </div>
              ))
            )}
            {busy ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-2/3 rounded-2xl" />
                <p className="text-xs text-muted-foreground">Thinking with your profile…</p>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="cv-composer flex-col gap-2 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Ask about your next career move…"
                disabled={busy || remaining === 0}
                maxLength={MAX_CHARS}
                className="flex-1 border-border bg-white"
              />
              <p className="px-1 text-[11px] text-muted-foreground">
                {charsLeft} chars left
                {remaining != null ? ` · ${remaining}/${limit} messages left today` : ""}
              </p>
            </div>
            <Button
              type="submit"
              disabled={busy || !message.trim() || remaining === 0}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
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
