"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { createSoftCache } from "@/lib/client-cache";

import {
  STATUSES,
  type AppStatus,
  type ApplicationItem,
  TERMINAL,
} from "./components/ApplicationTimeline";
import { ApplicationsFilters } from "./components/ApplicationsFilters";
import { ApplicationsList } from "./components/ApplicationsList";
import { ApplicationDetail } from "./components/ApplicationDetail";
import { ApplicationsKanban } from "./components/ApplicationsKanban";

import "./applications.css";

const STUDENT_LOCKED: AppStatus[] = ["HIRED"];

type TabKey = "all" | "active" | "offers" | "closed";

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
    // Ignore quota issues
  }
}

export default function ApplicationsPage() {
  const [items, setItems] = useState<ApplicationItem[]>(() => appsCache.peek()?.items || []);
  const [source, setSource] = useState<string>(() => appsCache.peek()?.source || "");
  const [loading, setLoading] = useState(!appsCache.has());
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [tab, setTab] = useState<TabKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilters, setStatusFilters] = useState<AppStatus[]>([]);
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [highMatchOnly, setHighMatchOnly] = useState(false);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load applications");
        const local = readLocal();
        if (local) {
          setItems(local);
          setSource("localStorage");
        }
        return;
      }
      const fetched = (data.items || []) as ApplicationItem[];
      setItems(fetched);
      setSource(data.source || "live");
      writeLocal(fetched);
      appsCache.set({ items: fetched, source: data.source || "live" });
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
    const active = items.filter((i) => !TERMINAL.includes(i.status) && i.status !== "OFFER" && i.status !== "HIRED").length;
    const offers = items.filter((i) => i.status === "OFFER" || i.status === "HIRED").length;
    const closed = items.filter((i) => TERMINAL.includes(i.status)).length;
    return { all: items.length, active, offers, closed };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === "active" && (TERMINAL.includes(item.status) || item.status === "OFFER" || item.status === "HIRED")) return false;
      if (tab === "offers" && item.status !== "OFFER" && item.status !== "HIRED") return false;
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
    const current = items.find((item) => item.id === id);
    if (STUDENT_LOCKED.includes(status) || current?.status === "HIRED") return;
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
              <ApplicationsFilters
                statusFilters={statusFilters}
                toggleStatus={toggleStatus}
                typeOptions={typeOptions}
                typeFilters={typeFilters}
                toggleType={toggleType}
                highMatchOnly={highMatchOnly}
                setHighMatchOnly={setHighMatchOnly}
                resetFilters={resetFilters}
              />

              {/* List */}
              <ApplicationsList
                filtered={filtered}
                selectedId={selected?.id || null}
                onSelectId={setSelectedId}
              />

              {/* Detail */}
              <ApplicationDetail
                selected={selected}
                updatingId={updatingId}
                onUpdateStatus={updateStatus}
              />
            </div>
          </div>
        </div>
      ) : (
        <ApplicationsKanban
          byStatus={byStatus}
          onCardClick={(id) => {
            setView("list");
            setSelectedId(id);
          }}
        />
      )}
    </div>
  );
}
