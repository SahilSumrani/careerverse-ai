"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_NAMES, type RoleName } from "@/lib/roles";
import "@/styles/cv-product.css";

type AdminPayload = {
  overview: {
    users: number;
    applications: number;
    opportunities: number;
    aiEventsToday: number;
  };
  recentUsers: Array<{
    id: string;
    name?: string | null;
    email: string;
    roles: RoleName[];
    recruiterApproved: boolean;
    mentorApproved?: boolean;
    registration?: {
      track?: string;
      companyName?: string | null;
      jobTitle?: string | null;
      expertise?: string | null;
    } | null;
    suspendedAt?: string | null;
    onboardingComplete?: boolean;
    preferredLocations: string[];
    createdAt?: string;
  }>;
  locationBreakdown: Array<{ location: string; count: number }>;
  aiUsage: Array<{
    id: string;
    operation: string;
    model: string | null;
    tokensIn: number;
    tokensOut: number;
    success: boolean;
    userId: string | null;
    createdAt: string | null;
  }>;
  chatLimits: { dailyCap: number; maxInputChars: number };
  note?: string;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client fetch
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
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Platform ops: users, location preferences, AI usage, and chat limits. PLATFORM_ADMIN only."
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data?.note ? <p className="text-sm text-muted-foreground">{data.note}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState
          title="Admin unavailable"
          description="Sign in with a PLATFORM_ADMIN account (or set roles to include ADMIN / PLATFORM_ADMIN in Firestore)."
        />
      ) : (
        <div className="cv-shell">
          <div className="cv-shell-inner space-y-6 p-4 md:p-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ["Users", data.overview.users],
                  ["Applications", data.overview.applications],
                  ["Jobs listed", data.overview.opportunities],
                  ["AI events today", data.overview.aiEventsToday],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="cv-panel p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-display text-3xl tracking-tight">{value}</p>
                </div>
              ))}
            </div>

            <div className="cv-panel p-4">
              <p className="text-sm font-semibold">Copilot limits (students)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.chatLimits.dailyCap} messages / day · {data.chatLimits.maxInputChars} char max per
                message · off-topic refused before LLM
              </p>
            </div>

            <div className="cv-panel flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">Job inventory</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Publish starter roles into Firestore `jobs` (isDemo: false). Safe to re-run — merges by id.
                </p>
              </div>
              <Button
                size="sm"
                disabled={busyId === "seed-jobs"}
                onClick={() => void postAction({ action: "seed_starter_jobs" }, "seed-jobs")}
              >
                {busyId === "seed-jobs" ? "Seeding…" : "Seed starter jobs"}
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Preferred locations</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  From profile preferredLocations only — empty if students have not set locations.
                </p>
                {data.locationBreakdown.length ? (
                  <ul className="mt-3 space-y-2">
                    {data.locationBreakdown.map((row) => (
                      <li key={row.location} className="flex items-center justify-between text-sm">
                        <span>{row.location}</span>
                        <Badge tone="info">{row.count}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No location preferences recorded yet.</p>
                )}
              </section>

              <section className="cv-panel p-4">
                <h2 className="text-sm font-semibold">Recent AI usage</h2>
                <p className="mt-1 text-xs text-muted-foreground">Latest tracked LLM / analysis events.</p>
                {data.aiUsage.length ? (
                  <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto text-sm">
                    {data.aiUsage.map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-border px-3 py-2">
                        <p className="font-medium">
                          {ev.operation}
                          {!ev.success ? " · failed" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ev.model || "n/a"} · in {ev.tokensIn} / out {ev.tokensOut}
                          {ev.createdAt ? ` · ${ev.createdAt.slice(0, 19).replace("T", " ")}` : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No AI usage logged yet.</p>
                )}
              </section>
            </div>

            <section className="cv-panel p-4">
              <h2 className="text-sm font-semibold">Users</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Suspend or adjust roles. Changes write to Firestore users/{"{uid}"}.
              </p>
              <ul className="mt-4 space-y-3">
                {data.recentUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {u.name || u.email}
                        {u.suspendedAt ? (
                          <>
                            {" "}
                            <Badge tone="warning">Suspended</Badge>
                          </>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email} · {u.roles.join(", ") || "STUDENT"}
                        {u.roles.includes("HR")
                          ? ` · Recruiter ${u.recruiterApproved ? "approved" : "pending"}`
                          : ""}
                        {u.roles.includes("MENTOR")
                          ? ` · Mentor ${u.mentorApproved ? "approved" : "pending"}`
                          : ""}
                        {u.registration?.companyName ? ` · ${u.registration.companyName}` : ""}
                        {u.registration?.expertise ? ` · ${u.registration.expertise}` : ""}
                        {u.preferredLocations.length
                          ? ` · ${u.preferredLocations.slice(0, 2).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`roles-${u.id}`}>
                        Roles for {u.email}
                      </label>
                      <select
                        id={`roles-${u.id}`}
                        key={`${u.id}-${u.roles.join(",")}`}
                        className="h-9 max-w-[160px] rounded-xl border border-border bg-white px-2 text-xs"
                        defaultValue={u.roles.includes("PLATFORM_ADMIN") ? "PLATFORM_ADMIN" : u.roles[0] || "STUDENT"}
                        disabled={busyId === u.id}
                        onChange={(e) => {
                          const role = e.target.value as RoleName;
                          void postAction({ action: "set_roles", id: u.id, roles: [role] }, u.id);
                        }}
                      >
                        {ROLE_NAMES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
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
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() => void postAction({ action: "unsuspend_user", id: u.id }, u.id)}
                        >
                          Unsuspend
                        </Button>
                      )}
                      {u.roles.includes("HR") ? (
                        <>
                          <Badge tone={u.recruiterApproved ? "success" : "warning"}>
                            {u.recruiterApproved ? "Recruiter approved" : "Recruiter pending"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() =>
                              void postAction(
                                { action: u.recruiterApproved ? "revoke_recruiter" : "approve_recruiter", id: u.id },
                                u.id,
                              )
                            }
                          >
                            {u.recruiterApproved ? "Revoke recruiter" : "Approve recruiter"}
                          </Button>
                        </>
                      ) : null}
                      {u.roles.includes("MENTOR") ? (
                        <>
                          <Badge tone={u.mentorApproved ? "success" : "warning"}>
                            {u.mentorApproved ? "Mentor approved" : "Mentor pending"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === u.id}
                            onClick={() =>
                              void postAction(
                                { action: u.mentorApproved ? "revoke_mentor" : "approve_mentor", id: u.id },
                                u.id,
                              )
                            }
                          >
                            {u.mentorApproved ? "Revoke mentor" : "Approve mentor"}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
              {!data.recentUsers.length ? (
                <p className="mt-3 text-sm text-muted-foreground">No users found.</p>
              ) : null}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
