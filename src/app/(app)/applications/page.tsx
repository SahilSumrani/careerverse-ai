"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { createSoftCache } from "@/lib/client-cache";

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

type ApplicationItem = {
  id: string;
  status: AppStatus;
  notes?: string | null;
  nextAction?: string | null;
  matchScore?: number | null;
  updatedAt: string;
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

export default function ApplicationsPage() {
  const cached = appsCache.peek();
  const [items, setItems] = useState<ApplicationItem[]>(cached?.items ?? []);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [source, setSource] = useState<string>(cached?.source ?? "");

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
        // Merge local status overrides for demo ids
        const map = new Map(local.map((a) => [a.id, a]));
        next = next.map((a) => {
          const override = map.get(a.id);
          return override ? { ...a, status: override.status, notes: override.notes, nextAction: override.nextAction } : a;
        });
      }
      setItems(next);
      writeLocal(next);
      const nextSource = data.source || (data.demo ? "demo" : "firestore");
      setSource(nextSource);
      appsCache.set({ items: next, source: nextSource });
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
        description="Track saved roles through prep, apply, interview, and offer. List view is the default."
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
          Source: {source.includes("demo") || source.includes("local") ? "Demo data (persists to Firestore when Admin is configured, else localStorage)" : source}
        </p>
      ) : null}

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
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
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/opportunities/${item.opportunity.id}`}
                    className="font-semibold hover:text-primary"
                  >
                    {item.opportunity.title}
                  </Link>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.opportunity.organizationName || "Organization"} · {item.opportunity.type}
                    {item.opportunity.isDemo || item.isDemo ? " · Demo" : ""}
                    {item.matchScore != null ? ` · ${item.matchScore}% match` : ""}
                  </p>
                  {item.nextAction ? (
                    <p className="mt-2 text-xs text-muted-foreground">Next: {item.nextAction}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge>{item.status}</Badge>
                  <Select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) => void updateStatus(item.id, e.target.value as AppStatus)}
                    className="w-36"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>
          ))}
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
                    <Card key={item.id} className="overflow-hidden p-3 shadow-none">
                      <CardHeader className="mb-2">
                        <CardTitle className="text-sm leading-snug">{item.opportunity.title}</CardTitle>
                        <CardDescription className="truncate">
                          {item.opportunity.organizationName || "Organization"}
                          {item.opportunity.isDemo ? " · Demo" : ""}
                        </CardDescription>
                      </CardHeader>
                      {item.matchScore != null ? (
                        <Badge tone="success" className="mb-2">
                          {item.matchScore}% match
                        </Badge>
                      ) : null}
                      <Select
                        value={item.status}
                        disabled={updatingId === item.id}
                        onChange={(e) => void updateStatus(item.id, e.target.value as AppStatus)}
                        className="h-9 w-full text-xs"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
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
