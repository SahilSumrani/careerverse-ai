"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminPayload = {
  overview: {
    users: number;
    opportunities: number;
    events: number;
    reports: number;
    approvals: number;
  };
  recentUsers: Array<{
    id: string;
    name?: string | null;
    email: string;
    isDemo?: boolean;
    suspendedAt?: string | null;
    roles: Array<{ role: { name: string } }>;
  }>;
  pendingOpps: Array<{
    id: string;
    title: string;
    organizationName?: string | null;
    type: string;
    isDemo?: boolean;
  }>;
  pendingApprovals: Array<{
    id: string;
    type: string;
    status: string;
    requester: { name?: string | null; email: string };
    institution?: { id: string; organization?: { name?: string | null } | null } | null;
  }>;
  analytics?: Array<{ name: string; _count: { name: number } }>;
};

export default function AdminPage() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load admin data");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postAction(body: Record<string, unknown>, id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Action failed");
        return;
      }
      await load();
    } catch {
      setError("Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        description="Platform overview, pending opportunity reviews, approval decisions, and recent users."
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState title="Admin unavailable" description="You may need PLATFORM_ADMIN access." />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["Users", data.overview.users],
                ["Opportunities", data.overview.opportunities],
                ["Events", data.overview.events],
                ["Open reports", data.overview.reports],
                ["Pending approvals", data.overview.approvals],
              ] as const
            ).map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-display text-3xl tracking-tight">{value}</p>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending opportunity approvals</CardTitle>
              <CardDescription>Publish or reject listings awaiting review.</CardDescription>
            </CardHeader>
            {data.pendingOpps.length ? (
              <ul className="space-y-3">
                {data.pendingOpps.map((opp) => (
                  <li key={opp.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <p className="font-medium">{opp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {opp.organizationName || "Organization"} · {opp.type}
                        {opp.isDemo ? " · Demo" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === opp.id}
                        onClick={() =>
                          void postAction({ action: "opportunity_status", id: opp.id, status: "PUBLISHED" }, opp.id)
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === opp.id}
                        onClick={() =>
                          void postAction({ action: "opportunity_status", id: opp.id, status: "REJECTED" }, opp.id)
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No opportunities pending review.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending institution approvals</CardTitle>
            </CardHeader>
            {data.pendingApprovals.length ? (
              <ul className="space-y-3">
                {data.pendingApprovals.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div>
                      <p className="font-medium">{a.type.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.requester.name || a.requester.email}
                        {a.institution?.organization?.name
                          ? ` · ${a.institution.organization.name}`
                          : a.institution
                            ? " · Institution linked"
                            : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === a.id}
                        onClick={() =>
                          void postAction({ action: "approval_decide", id: a.id, status: "APPROVED" }, a.id)
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === a.id}
                        onClick={() =>
                          void postAction({ action: "approval_decide", id: a.id, status: "REJECTED" }, a.id)
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No pending approval requests.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent users</CardTitle>
            </CardHeader>
            <ul className="space-y-2">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {u.name || u.email}
                      {u.isDemo ? " · Demo" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {u.roles.map((r) => r.role.name).join(", ") || "No roles"}
                      {u.suspendedAt ? " · Suspended" : ""}
                    </p>
                  </div>
                  {!u.suspendedAt ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busyId === u.id}
                      onClick={() => void postAction({ action: "suspend_user", id: u.id }, u.id)}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Badge tone="warning">Suspended</Badge>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
