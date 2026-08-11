"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSoftCache } from "@/lib/client-cache";
import { cn } from "@/lib/utils";

const STATUSES = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

type AppStatus = (typeof STATUSES)[number];

/** Primary pipeline shown on the expandable timeline */
const TIMELINE: Array<{
  key: AppStatus;
  label: string;
  hint: string;
}> = [
  { key: "SAVED", label: "Saved", hint: "Role bookmarked" },
  { key: "PREPARING", label: "Prep", hint: "Resume / materials" },
  { key: "APPLIED", label: "Applied", hint: "Application sent" },
  { key: "INTERVIEW", label: "Interview", hint: "Screens & rounds" },
  { key: "OFFER", label: "Offer", hint: "Decision stage" },
];

const TERMINAL: AppStatus[] = ["REJECTED", "WITHDRAWN"];

type ApplicationItem = {
  id: string;
  status: AppStatus;
  notes?: string | null;
  nextAction?: string | null;
  matchScore?: number | null;
  updatedAt: string;
  createdAt?: string;
  opportunity: {
    id: string;
    title: string;
    organizationName?: string | null;
    type: string;
    isDemo?: boolean;
  };
  isDemo?: boolean;
};

const LS_KEY = "cv-applications-v1";
type ApplicationsCache = { items: ApplicationItem[]; source: string };
const appsCache = createSoftCache<ApplicationsCache>();

function readLocal(): ApplicationItem[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ApplicationItem[];
  } catch {
    return null;
  }
}

function writeLocal(items: ApplicationItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function statusIndex(status: AppStatus) {
  if (status === "ASSESSMENT") return TIMELINE.findIndex((s) => s.key === "APPLIED");
  if (status === "REJECTED" || status === "WITHDRAWN") {
    return TIMELINE.findIndex((s) => s.key === "INTERVIEW");
  }
  const i = TIMELINE.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

function ApplicationTimeline({
  item,
  updating,
  onUpdate,
}: {
  item: ApplicationItem;
  updating: boolean;
  onUpdate: (status: AppStatus) => void;
}) {
  const current = statusIndex(item.status);
  const isTerminal = TERMINAL.includes(item.status);
  const updated = formatDate(item.updatedAt);
  const created = formatDate(item.createdAt);

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Pipeline
        </p>
        {updated ? <p className="text-xs text-muted-foreground">Updated {updated}</p> : null}
      </div>

      <ol className="relative grid gap-0 sm:grid-cols-5">
        {TIMELINE.map((stage, index) => {
          const done = !isTerminal && index < current;
          const active = !isTerminal && index === current;
          const future = !isTerminal && index > current;
          const rejectedHere = isTerminal && index === current;
          return (
            <li key={stage.key} className="relative flex flex-col items-stretch sm:items-center">
              {index < TIMELINE.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-[1.15rem] top-3 hidden h-0.5 w-[calc(100%-0.5rem)] sm:block",
                    done || active ? "bg-primary/70" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={updating}
                onClick={() => onUpdate(stage.key)}
                className={cn(
                  "relative z-[1] flex w-full items-start gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-muted/60 sm:flex-col sm:items-center sm:text-center",
                  updating && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                    active && "border-primary bg-primary text-primary-foreground shadow-sm",
                    done && "border-primary/40 bg-primary/15 text-primary",
                    future && "border-border bg-card text-muted-foreground",
                    rejectedHere && "border-destructive bg-destructive/10 text-destructive",
                  )}
                >
                  {done ? "✓" : index + 1}
                </span>
                <span className="min-w-0">
                  <span
                    className={cn(
                      "block text-sm font-semibold",
                      active ? "text-primary" : "text-foreground",
                    )}
                  >
                    {stage.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">{stage.hint}</span>
                  {active && created && stage.key === "SAVED" ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">{created}</span>
                  ) : null}
                  {active && updated && stage.key !== "SAVED" ? (
                    <span className="mt-1 block text-[11px] text-muted-foreground">{updated}</span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {isTerminal ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={item.status === "REJECTED" ? "warning" : "default"}>{item.status}</Badge>
          <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("SAVED")}>
            Reset to Saved
          </Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => onUpdate("REJECTED")}
          >
            Mark rejected
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={updating}
            onClick={() => onUpdate("WITHDRAWN")}
          >
            Withdraw
          </Button>
        </div>
      )}

      {item.nextAction ? (
        <p className="mt-3 rounded-xl bg-accent/60 px-3 py-2 text-xs text-foreground">
          <span className="font-semibold">Next step:</span> {item.nextAction}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Tap a stage to update status. Dates appear when the stage is current.
        </p>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const cached = appsCache.peek();
  const [items, setItems] = useState<ApplicationItem[]>(cached?.items ?? []);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [source, setSource] = useState<string>(cached?.source ?? "");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? appsCache.has();
    if (!soft) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load applications");
        const local = readLocal();
        setItems(local || []);
        setSource(local ? "localStorage" : "");
        return;
      }
      let next: ApplicationItem[] = data.items || [];
      const local = readLocal();
      if (local?.length) {
        const map = new Map(local.map((a) => [a.id, a]));
        next = next.map((a) => {
          const override = map.get(a.id);
          return override
            ? { ...a, status: override.status, notes: override.notes, nextAction: override.nextAction }
            : a;
        });
      }
      setItems(next);
      writeLocal(next);
      const nextSource = data.source || (data.demo ? "demo" : "firestore");
      setSource(nextSource);
      appsCache.set({ items: next, source: nextSource });
      if (!expandedId && next[0]) setExpandedId(next[0].id);
    } catch {
      setError("Unable to load applications");
      setItems(readLocal() || []);
      setSource("localStorage");
    } finally {
      setLoading(false);
    }
  }, [expandedId]);

  useEffect(() => {
    void load({ soft: appsCache.has() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- soft load once on mount
  }, []);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(STATUSES.map((s) => [s, [] as ApplicationItem[]])) as Record<
      AppStatus,
      ApplicationItem[]
    >;
    for (const item of items) {
      if (map[item.status]) map[item.status].push(item);
      else map.SAVED.push(item);
    }
    return map;
  }, [items]);

  async function updateStatus(id: string, status: AppStatus) {
    setUpdatingId(id);
    setError("");
    setExpandedId(id);
    setItems((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a));
      writeLocal(next);
      appsCache.set({ items: next, source: source || "local" });
      return next;
    });
    try {
      const res = await fetch("/api/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to update status");
        return;
      }
      setItems((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...data.application } : a));
        writeLocal(next);
        appsCache.set({ items: next, source: source || "firestore" });
        return next;
      });
    } catch {
      setError("Saved locally — server sync failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Application Tracker"
        description="Open a role to see the stage timeline — Saved → Prep → Applied → Interview → Offer."
        actions={
          <div className="flex gap-2">
            <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
              List
            </Button>
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
              Board
            </Button>
          </div>
        }
      />

      {source ? (
        <p className="mb-3 text-xs text-muted-foreground">
          Source:{" "}
          {source.includes("demo") || source.includes("local")
            ? "Demo data (persists to Firestore when Admin is configured, else localStorage)"
            : source}
        </p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          title="No applications yet"
          description="Save opportunities to track prep, applications, interviews, and offers in one place."
          action={
            <Link href="/opportunities/browse">
              <Button>Explore jobs</Button>
            </Link>
          }
        />
      ) : view === "list" ? (
        <div className="space-y-3">
          {items.map((item) => {
            const open = expandedId === item.id;
            const stage = TIMELINE[statusIndex(item.status)];
            return (
              <Card key={item.id} className={cn("overflow-hidden transition", open && "ring-1 ring-primary/25")}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 p-4 text-left"
                  onClick={() => setExpandedId(open ? null : item.id)}
                  aria-expanded={open}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/opportunities/${item.opportunity.id}`}
                        className="font-semibold hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.opportunity.title}
                      </Link>
                      {(item.opportunity.isDemo || item.isDemo) && <Badge tone="warning">Demo</Badge>}
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {item.opportunity.organizationName || "Organization"} · {item.opportunity.type}
                      {item.matchScore != null ? ` · ${item.matchScore}% match` : ""}
                    </p>
                    {item.nextAction ? (
                      <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        Next: {item.nextAction}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={TERMINAL.includes(item.status) ? "warning" : open ? "info" : "default"}>
                      {TERMINAL.includes(item.status) ? item.status : stage?.label || item.status}
                    </Badge>
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")}
                    />
                  </div>
                </button>
                {open ? (
                  <div className="px-4 pb-4">
                    <ApplicationTimeline
                      item={item}
                      updating={updatingId === item.id}
                      onUpdate={(status) => void updateStatus(item.id, status)}
                    />
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STATUSES.filter((s) => ["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"].includes(s)).map(
            (status) => (
              <div key={status} className="min-w-0">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">{status}</p>
                  <Badge>{byStatus[status].length}</Badge>
                </div>
                <div className="min-h-40 space-y-2 rounded-2xl border border-border bg-muted/40 p-2">
                  {byStatus[status].map((item) => (
                    <Card
                      key={item.id}
                      className="cursor-pointer overflow-hidden p-3 shadow-none transition hover:border-primary/30"
                      onClick={() => {
                        setView("list");
                        setExpandedId(item.id);
                      }}
                    >
                      <CardHeader className="mb-1">
                        <CardTitle className="text-sm leading-snug">{item.opportunity.title}</CardTitle>
                        <CardDescription className="truncate">
                          {item.opportunity.organizationName || "Organization"}
                          {item.opportunity.isDemo ? " · Demo" : ""}
                        </CardDescription>
                      </CardHeader>
                      {item.matchScore != null ? (
                        <Badge tone="success" className="mb-1">
                          {item.matchScore}% match
                        </Badge>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground">Click for timeline</p>
                    </Card>
                  ))}
                  {!byStatus[status].length ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
