"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock3,
  Filter,
  MapPin,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSoftCache } from "@/lib/client-cache";
import { cn } from "@/lib/utils";
import "./applications.css";

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

const TIMELINE: Array<{ key: AppStatus; label: string; hint: string }> = [
  { key: "SAVED", label: "Saved", hint: "Bookmarked" },
  { key: "PREPARING", label: "Prep", hint: "Getting ready" },
  { key: "APPLIED", label: "Applied", hint: "Submitted" },
  { key: "INTERVIEW", label: "Interview", hint: "In progress" },
  { key: "OFFER", label: "Offer", hint: "Decision" },
];

const TERMINAL: AppStatus[] = ["REJECTED", "WITHDRAWN"];

const FILTER_STATUSES: AppStatus[] = ["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"];

type TabKey = "all" | "active" | "offers" | "closed";

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
    const parsed = JSON.parse(raw) as ApplicationItem[];
    const real = parsed.filter((a) => !a.isDemo && !a.id.startsWith("demo-app-") && !a.opportunity?.isDemo);
    if (real.length !== parsed.length) writeLocal(real);
    return real;
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
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return null;
  }
}

function companyInitials(name?: string | null) {
  const parts = (name || "CV").trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "CV";
}

function statusLabel(status: AppStatus) {
  if (status === "PREPARING") return "Prep";
  if (status === "ASSESSMENT") return "Under review";
  if (status === "APPLIED") return "Applied";
  if (status === "INTERVIEW") return "Interview";
  if (status === "OFFER") return "Offer";
  if (status === "WITHDRAWN") return "Withdrawn";
  if (status === "REJECTED") return "Closed";
  if (status === "SAVED") return "Saved";
  return status;
}

function statusMeta(status: AppStatus) {
  if (status === "OFFER") {
    return { tone: "accent" as const, icon: Sparkles, className: "text-emerald-700" };
  }
  if (status === "INTERVIEW" || status === "ASSESSMENT") {
    return { tone: "info" as const, icon: Clock3, className: "text-sky-700" };
  }
  if (status === "APPLIED") {
    return { tone: "success" as const, icon: CheckCircle2, className: "text-emerald-700" };
  }
  if (status === "REJECTED" || status === "WITHDRAWN") {
    return { tone: "warning" as const, icon: XCircle, className: "text-amber-700" };
  }
  if (status === "PREPARING") {
    return { tone: "violet" as const, icon: Clock3, className: "text-violet-700" };
  }
  return { tone: "default" as const, icon: MapPin, className: "text-muted-foreground" };
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

  return (
    <div>
      <ol className="relative grid grid-cols-5 gap-1">
        {TIMELINE.map((stage, index) => {
          const done = !isTerminal && index < current;
          const active = !isTerminal && index === current;
          const future = !isTerminal && index > current;
          return (
            <li key={stage.key} className="relative flex flex-col items-center text-center">
              {index < TIMELINE.length - 1 ? (
                <span
                  className={cn(
                    "cv-apps-step-line absolute left-[calc(50%+14px)] top-[13px] h-0.5 w-[calc(100%-28px)]",
                    done || active ? "bg-emerald-500" : "bg-border",
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                disabled={updating}
                onClick={() => onUpdate(stage.key)}
                className="relative z-[1] flex flex-col items-center gap-1.5 disabled:opacity-60"
              >
                <span
                  className={cn(
                    "cv-apps-step-dot flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-bold transition duration-200",
                    active && "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,0.18)]",
                    done && "border-emerald-500 bg-emerald-500 text-white",
                    future && "border-border bg-white text-muted-foreground",
                    isTerminal && index === current && "border-amber-500 bg-amber-500 text-white",
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  {done || active ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold leading-tight sm:text-xs",
                    active ? "text-emerald-700" : "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </span>
                {active ? (
                  <span className="hidden text-[10px] text-muted-foreground sm:block">{stage.hint}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex flex-wrap gap-2">
        {isTerminal ? (
          <>
            <Badge tone="warning">{statusLabel(item.status)}</Badge>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("SAVED")}>
              Reset to Saved
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("REJECTED")}>
              Mark rejected
            </Button>
            <Button size="sm" variant="outline" disabled={updating} onClick={() => onUpdate("WITHDRAWN")}>
              Withdraw
            </Button>
          </>
        )}
      </div>
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
  const [selectedId, setSelectedId] = useState<string | null>(cached?.items?.[0]?.id ?? null);
  const [tab, setTab] = useState<TabKey>("all");
  const [statusFilters, setStatusFilters] = useState<AppStatus[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [highMatchOnly, setHighMatchOnly] = useState(false);

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
      setSelectedId((prev) => prev || next[0]?.id || null);
    } catch {
      setError("Unable to load applications");
      setItems(readLocal() || []);
      setSource("localStorage");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ soft: appsCache.has() });
  }, [load]);

  const typeOptions = useMemo(() => {
    const set = new Set(items.map((i) => i.opportunity.type).filter(Boolean));
    return Array.from(set);
  }, [items]);

  const tabCounts = useMemo(() => {
    const active = items.filter((i) => !TERMINAL.includes(i.status) && i.status !== "OFFER").length;
    const offers = items.filter((i) => i.status === "OFFER").length;
    const closed = items.filter((i) => TERMINAL.includes(i.status)).length;
    return { all: items.length, active, offers, closed };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === "active" && (TERMINAL.includes(item.status) || item.status === "OFFER")) return false;
      if (tab === "offers" && item.status !== "OFFER") return false;
      if (tab === "closed" && !TERMINAL.includes(item.status)) return false;
      if (statusFilters.length && !statusFilters.includes(item.status)) return false;
      if (typeFilters.length && !typeFilters.includes(item.opportunity.type)) return false;
      if (highMatchOnly && (item.matchScore == null || item.matchScore < 70)) return false;
      return true;
    });
  }, [items, tab, statusFilters, typeFilters, highMatchOnly]);

  const selected = useMemo(
    () => filtered.find((i) => i.id === selectedId) || filtered[0] || null,
    [filtered, selectedId],
  );

  useEffect(() => {
    if (!filtered.length) return;
    if (!selectedId || !filtered.some((i) => i.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

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

  function toggleStatus(status: AppStatus) {
    setStatusFilters((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  function toggleType(type: string) {
    setTypeFilters((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  }

  function resetFilters() {
    setStatusFilters([]);
    setTypeFilters([]);
    setHighMatchOnly(false);
    setTab("all");
  }

  async function updateStatus(id: string, status: AppStatus) {
    setUpdatingId(id);
    setError("");
    setSelectedId(id);
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
        appsCache.set({ items: next, source: source || "live" });
        return next;
      });
    } catch {
      setError("Saved locally — server sync failed");
    } finally {
      setUpdatingId(null);
    }
  }

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "all", label: "All applications", count: tabCounts.all },
    { key: "active", label: "In progress", count: tabCounts.active },
    { key: "offers", label: "Offers", count: tabCounts.offers },
    { key: "closed", label: "Closed", count: tabCounts.closed },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden">
      <PageHeader
        title="Application Tracker"
        description="Untitled-style board — filter, select a role, and move it through the pipeline."
        actions={
          <div className="flex gap-2 rounded-xl border border-border bg-card p-1 shadow-sm">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setView("list")}
            >
              List
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setView("kanban")}
            >
              Board
            </Button>
          </div>
        }
      />

      {source && (source.includes("demo") || source.includes("local")) ? (
        <p className="mb-3 text-xs text-muted-foreground">Demo data — saves to your account when signed in.</p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="cv-apps-shell p-4">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.15fr)]">
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
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
        <div className="cv-apps-shell">
          <div className="cv-apps-inner">
            <div className="cv-apps-tabs">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  className="cv-apps-tab"
                  data-active={tab === t.key}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  <span className="ml-1.5 text-xs font-semibold text-muted-foreground">({t.count})</span>
                </button>
              ))}
            </div>

            <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1.2fr)]">
              {/* Filters */}
              <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    Filter
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Status
                    </p>
                    <div className="space-y-2">
                      {FILTER_STATUSES.map((status) => (
                        <label key={status} className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={statusFilters.includes(status)}
                            onChange={() => toggleStatus(status)}
                            className="h-4 w-4 rounded border-border text-primary accent-primary"
                          />
                          <span>{statusLabel(status)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {typeOptions.length ? (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                        Job type
                      </p>
                      <div className="space-y-2">
                        {typeOptions.map((type) => (
                          <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={typeFilters.includes(type)}
                              onChange={() => toggleType(type)}
                              className="h-4 w-4 rounded border-border text-primary accent-primary"
                            />
                            <span>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      Match
                    </p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={highMatchOnly}
                        onChange={() => setHighMatchOnly((v) => !v)}
                        className="h-4 w-4 rounded border-border text-primary accent-primary"
                      />
                      <span>70%+ match only</span>
                    </label>
                  </div>
                </div>
              </aside>

              {/* List */}
              <div className="max-h-[70vh] space-y-3 overflow-y-auto border-b border-border p-4 lg:border-b-0 lg:border-r">
                {!filtered.length ? (
                  <p className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-10 text-center text-sm text-muted-foreground">
                    No applications match these filters.
                  </p>
                ) : (
                  filtered.map((item, index) => {
                    const active = selected?.id === item.id;
                    const org = item.opportunity.organizationName || "Organization";
                    const meta = statusMeta(item.status);
                    const StatusIcon = meta.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="cv-apps-card w-full p-4 text-left"
                        data-active={active}
                        style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[#f2f4f7] text-xs font-bold text-foreground">
                            {companyInitials(org)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-semibold text-foreground">
                              {item.opportunity.title}
                            </p>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">{org}</p>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              <Badge>{item.opportunity.type}</Badge>
                              {item.matchScore != null ? <Badge tone="info">{item.matchScore}% match</Badge> : null}
                              {(item.opportunity.isDemo || item.isDemo) && <Badge tone="warning">Demo</Badge>}
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/80 pt-3">
                              <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", meta.className)}>
                                <span className="cv-apps-status-dot" />
                                <StatusIcon className="h-3.5 w-3.5" />
                                {statusLabel(item.status)}
                              </span>
                              <span className="text-[11px] font-medium text-primary transition group-hover:underline">
                                View details
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Detail */}
              <div className="p-4">
                {selected ? (
                  <div key={selected.id} className="cv-apps-detail p-5 lg:sticky lg:top-20">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-[#f2f4f7] text-sm font-bold">
                          {companyInitials(selected.opportunity.organizationName)}
                        </div>
                        <h2 className="font-display text-2xl tracking-tight">{selected.opportunity.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selected.opportunity.organizationName || "Organization"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/opportunities/${selected.opportunity.id}`}>
                          <Button size="sm" variant="outline" className="rounded-xl">
                            View role
                          </Button>
                        </Link>
                        <Badge tone={statusMeta(selected.status).tone} className="rounded-xl px-3 py-1.5 text-xs">
                          {statusLabel(selected.status)}
                        </Badge>
                      </div>
                    </div>

                    {selected.matchScore != null ? (
                      <div className="mt-4">
                        <span className="cv-apps-match">
                          <Sparkles className="h-3.5 w-3.5" aria-hidden />
                          {selected.matchScore}% matched with your skills
                        </span>
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <Badge>{selected.opportunity.type}</Badge>
                      {(selected.opportunity.isDemo || selected.isDemo) && <Badge tone="warning">Demo</Badge>}
                      {formatDate(selected.createdAt) ? (
                        <Badge tone="default">Tracked {formatDate(selected.createdAt)}</Badge>
                      ) : null}
                    </div>

                    {selected.nextAction ? (
                      <p className="mt-4 rounded-xl border border-border bg-[#f9fafb] px-3.5 py-3 text-sm text-foreground">
                        <span className="font-semibold text-primary">Next step:</span> {selected.nextAction}
                      </p>
                    ) : null}

                    <div className="mt-5 rounded-2xl border border-border bg-[#f9fafb] p-4">
                      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Application progress
                      </p>
                      <ApplicationTimeline
                        item={selected}
                        updating={updatingId === selected.id}
                        onUpdate={(status) => void updateStatus(selected.id, status)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border bg-white/70 px-4 py-16 text-center text-sm text-muted-foreground">
                    Select an application to see details.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="cv-apps-shell p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {(["SAVED", "PREPARING", "APPLIED", "INTERVIEW", "OFFER"] as AppStatus[]).map((status, colIndex) => (
              <div
                key={status}
                className="min-w-0"
                style={{ animation: `cv-apps-card-in 480ms cubic-bezier(0.16, 1, 0.3, 1) both`, animationDelay: `${colIndex * 60}ms` }}
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground">{statusLabel(status)}</p>
                  <Badge>{byStatus[status].length}</Badge>
                </div>
                <div className="min-h-40 space-y-2 rounded-2xl border border-border bg-white/70 p-2">
                  {byStatus[status].map((item, index) => (
                    <Card
                      key={item.id}
                      className="cv-apps-card cursor-pointer overflow-hidden p-3 shadow-none"
                      style={{ animationDelay: `${index * 40}ms` }}
                      onClick={() => {
                        setView("list");
                        setSelectedId(item.id);
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
                    </Card>
                  ))}
                  {!byStatus[status].length ? (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground">Empty</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
