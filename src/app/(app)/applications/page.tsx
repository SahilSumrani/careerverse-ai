"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";

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
};

export default function ApplicationsPage() {
  const [items, setItems] = useState<ApplicationItem[]>([]);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load applications");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch {
      setError("Unable to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, ...data.application } : a)));
    } catch {
      setError("Unable to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Application Tracker"
        description="Kanban and list views for every opportunity you are tracking. Move stages as you progress."
        actions={
          <div className="flex gap-2">
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" onClick={() => setView("kanban")}>
              Kanban
            </Button>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}>
              List
            </Button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !items.length ? (
        <EmptyState
          title="No applications yet"
          description="Save opportunities to track prep, applications, interviews, and offers in one place."
          action={
            <Link href="/jobs">
              <Button>Explore jobs</Button>
            </Link>
          }
        />
      ) : view === "list" ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href="/jobs" className="font-semibold hover:text-primary">
                    {item.opportunity.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.opportunity.organizationName || "Organization"} · {item.opportunity.type}
                    {item.opportunity.isDemo ? " · Demo" : ""}
                    {item.matchScore != null ? ` · ${item.matchScore}% match` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{item.status}</Badge>
                  <Select
                    value={item.status}
                    disabled={updatingId === item.id}
                    onChange={(e) => void updateStatus(item.id, e.target.value as AppStatus)}
                    className="w-40"
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
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STATUSES.map((status) => (
            <div key={status} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground">{status}</p>
                <Badge>{byStatus[status].length}</Badge>
              </div>
              <div className="space-y-2 rounded-2xl border border-border bg-muted/40 p-2 min-h-40">
                {byStatus[status].map((item) => (
                  <Card key={item.id} className="p-3 shadow-none">
                    <CardHeader className="mb-2">
                      <CardTitle className="text-sm leading-snug">{item.opportunity.title}</CardTitle>
                      <CardDescription>
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
                      className="h-9 text-xs"
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
          ))}
        </div>
      )}
    </div>
  );
}
