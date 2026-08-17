"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_NAMES, type RoleName } from "@/lib/roles";
import "@/styles/admin-console.css";

type Track = "student" | "mentor" | "recruiter";

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
  registrationBreakdown: {
    students: number;
    mentors: number;
    recruiters: number;
    pendingMentors: number;
    pendingRecruiters: number;
  };
  recentRegistrations: Array<{
    id: string;
    name?: string | null;
    email: string;
    track: Track;
    createdAt: string | null;
    pending: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    name: string;
    userId: string | null;
    props: Record<string, unknown> | null;
    createdAt: string | null;
  }>;
  flags: Array<{ id: string; severity: "warning" | "critical"; label: string; userId?: string }>;
  focusedUser: {
    id: string;
    name?: string | null;
    email: string;
    roles: string[];
    activity: Array<{
      id: string;
      name: string;
      userId: string | null;
      props: Record<string, unknown> | null;
      createdAt: string | null;
    }>;
    aiUsage: Array<{ id: string; operation: string; createdAt: string | null; success: boolean }>;
  } | null;
  chatLimits: { dailyCap: number; maxInputChars: number };
  note?: string;
  serverTime?: string;
};

const POLL_MS = 12_000;

function Donut({
  students,
  mentors,
  recruiters,
}: {
  students: number;
  mentors: number;
  recruiters: number;
}) {
  const total = Math.max(students + mentors + recruiters, 1);
  const r = 42;
  const c = 2 * Math.PI * r;
  const s1 = (students / total) * c;
  const s2 = (mentors / total) * c;
  const s3 = (recruiters / total) * c;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="14" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#2563eb"
        strokeWidth="14"
        strokeDasharray={`${s1} ${c - s1}`}
        strokeDashoffset={c * 0.25}
        transform="rotate(-90 60 60)"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#db2777"
        strokeWidth="14"
        strokeDasharray={`${s2} ${c - s2}`}
        strokeDashoffset={c * 0.25 - s1}
        transform="rotate(-90 60 60)"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#ea580c"
        strokeWidth="14"
        strokeDasharray={`${s3} ${c - s3}`}
        strokeDashoffset={c * 0.25 - s1 - s2}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
        {students + mentors + recruiters}
      </text>
      <text x="60" y="74" textAnchor="middle" fontSize="9" fill="#64748b">
        sample
      </text>
    </svg>
  );
}

function AdminConsoleInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const [data, setData] = useState<AdminPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const load = useCallback(async (opts?: { soft?: boolean; userId?: string | null }) => {
    if (!opts?.soft) setLoading(true);
    setError("");
    try {
      const q = opts?.userId ? `?userId=${encodeURIComponent(opts.userId)}` : "";
      const res = await fetch(`/api/admin${q}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Unable to load admin data");
        if (!opts?.soft) setData(null);
        return;
      }
      setData(json);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch {
      setError("Unable to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial admin fetch
    void load();
    const id = window.setInterval(() => void load({ soft: true, userId: selectedId }), POLL_MS);
    return () => window.clearInterval(id);
  }, [load, selectedId]);

  async function openUser(id: string) {
    setSelectedId(id);
    await load({ soft: true, userId: id });
  }

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
      await load({ soft: true, userId: selectedId });
    } catch {
      setError("Action failed");
    } finally {
      setBusyId(null);
    }
  }

  const rb = data?.registrationBreakdown;
  const maxLoc = useMemo(
    () => Math.max(1, ...(data?.locationBreakdown.map((l) => l.count) ?? [1])),
    [data?.locationBreakdown],
  );

  return (
    <div className="cv-admin">
      <div className="cv-admin-hero">
        <div>
          <PageHeader
            title="Admin console"
            description="Live registrations, user activity, and platform controls."
          />
        </div>
        <div className="cv-admin-live" aria-live="polite">
          <span className="cv-admin-live-dot" />
          Live · refresh {lastRefresh || "…"}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data?.note ? <p className="text-sm text-muted-foreground">{data.note}</p> : null}

      {loading && !data ? (
        <div className="cv-admin-metrics">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : !data ? (
        <EmptyState title="Admin unavailable" description="PLATFORM_ADMIN session required." />
      ) : (
        <>
          <div className="cv-admin-metrics">
            {(
              [
                ["Users", data.overview.users, "blue"],
                ["Students", rb?.students ?? 0, "pink"],
                ["Mentors", rb?.mentors ?? 0, "violet"],
                ["Recruiters", rb?.recruiters ?? 0, "orange"],
                ["Applications", data.overview.applications, "green"],
                ["Jobs", data.overview.opportunities, "slate"],
              ] as const
            ).map(([label, value, tone]) => (
              <div key={label} className="cv-admin-metric" data-tone={tone}>
                <p>{label}</p>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          {(tab === "dashboard" || tab === "registrations") && (
            <div className="cv-admin-grid cv-admin-grid-main">
              <section className="cv-admin-card">
                <h2>Registration mix</h2>
                <p className="sub">Who is signing up (from recent user sample).</p>
                <div className="cv-admin-donut-wrap">
                  <Donut
                    students={rb?.students ?? 0}
                    mentors={rb?.mentors ?? 0}
                    recruiters={rb?.recruiters ?? 0}
                  />
                  <ul className="cv-admin-legend">
                    <li>
                      <span className="cv-admin-swatch" style={{ background: "#2563eb" }} />
                      Students · {rb?.students ?? 0}
                    </li>
                    <li>
                      <span className="cv-admin-swatch" style={{ background: "#db2777" }} />
                      Mentors · {rb?.mentors ?? 0}
                      {rb?.pendingMentors ? ` (${rb.pendingMentors} pending)` : ""}
                    </li>
                    <li>
                      <span className="cv-admin-swatch" style={{ background: "#ea580c" }} />
                      Recruiters · {rb?.recruiters ?? 0}
                      {rb?.pendingRecruiters ? ` (${rb.pendingRecruiters} pending)` : ""}
                    </li>
                  </ul>
                </div>
              </section>

              <section className="cv-admin-card">
                <h2>Live registrations</h2>
                <p className="sub">Newest student / mentor / recruiter signups · auto-refresh.</p>
                <div className="cv-admin-feed">
                  {data.recentRegistrations.map((r) => (
                    <button key={r.id} type="button" onClick={() => void openUser(r.id)}>
                      <div className="title">
                        {r.name || r.email}{" "}
                        <Badge tone={r.track === "student" ? "info" : r.track === "mentor" ? "warning" : "success"}>
                          {r.track}
                        </Badge>
                        {r.pending ? <Badge tone="warning">pending</Badge> : null}
                      </div>
                      <div className="meta">
                        {r.email}
                        {r.createdAt ? ` · ${r.createdAt.slice(0, 16).replace("T", " ")}` : ""}
                      </div>
                    </button>
                  ))}
                  {!data.recentRegistrations.length ? (
                    <p className="text-sm text-muted-foreground">No registrations yet.</p>
                  ) : null}
                </div>
              </section>
            </div>
          )}

          {(tab === "dashboard" || tab === "activity") && (
            <div className="cv-admin-grid cv-admin-grid-main">
              <section className="cv-admin-card">
                <h2>Activity feed</h2>
                <p className="sub">Signup, resume, onboarding, AI events · click user when linked.</p>
                <div className="cv-admin-feed">
                  {data.recentActivity.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      className="row"
                      disabled={!ev.userId}
                      onClick={() => (ev.userId ? void openUser(ev.userId) : undefined)}
                    >
                      <div className="title">{ev.name}</div>
                      <div className="meta">
                        {ev.userId ? `user ${ev.userId.slice(0, 8)}…` : "system"}
                        {ev.createdAt ? ` · ${ev.createdAt.slice(0, 19).replace("T", " ")}` : ""}
                        {ev.props && "track" in ev.props ? ` · ${String(ev.props.track)}` : ""}
                      </div>
                    </button>
                  ))}
                  {!data.recentActivity.length ? (
                    <p className="text-sm text-muted-foreground">No analytics events yet.</p>
                  ) : null}
                </div>
              </section>

              <section className="cv-admin-card">
                <h2>Watchlist</h2>
                <p className="sub">Pending approvals, suspensions, noisy AI failures.</p>
                <div className="cv-admin-feed">
                  {data.flags.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className="cv-admin-flag"
                      data-severity={f.severity}
                      disabled={!f.userId}
                      onClick={() => (f.userId ? void openUser(f.userId) : undefined)}
                    >
                      {f.label}
                    </button>
                  ))}
                  {!data.flags.length ? (
                    <p className="text-sm text-muted-foreground">Nothing flagged right now.</p>
                  ) : null}
                </div>
              </section>
            </div>
          )}

          {(tab === "dashboard" || tab === "ops") && (
            <div className="cv-admin-grid cv-admin-grid-main">
              <section className="cv-admin-card">
                <h2>Preferred locations</h2>
                <p className="sub">Where students say they want to work.</p>
                <div className="cv-admin-bars">
                  {data.locationBreakdown.slice(0, 8).map((row) => (
                    <div key={row.location} className="cv-admin-bar-row">
                      <header>
                        <span>{row.location}</span>
                        <span>{row.count}</span>
                      </header>
                      <div className="cv-admin-bar-track">
                        <div
                          className="cv-admin-bar-fill"
                          style={{ width: `${Math.round((row.count / maxLoc) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!data.locationBreakdown.length ? (
                    <p className="text-sm text-muted-foreground">No location preferences yet.</p>
                  ) : null}
                </div>
              </section>

              <section className="cv-admin-card space-y-3">
                <div>
                  <h2>Ops</h2>
                  <p className="sub">
                    Copilot: {data.chatLimits.dailyCap}/day · {data.chatLimits.maxInputChars} chars · AI
                    events today {data.overview.aiEventsToday}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={busyId === "seed-jobs"}
                  onClick={() => void postAction({ action: "seed_starter_jobs" }, "seed-jobs")}
                >
                  {busyId === "seed-jobs" ? "Seeding…" : "Seed starter jobs"}
                </Button>
                <div className="cv-admin-feed">
                  {data.aiUsage.slice(0, 8).map((ev) => (
                    <div key={ev.id} className="row">
                      <div className="title">
                        {ev.operation}
                        {!ev.success ? " · failed" : ""}
                      </div>
                      <div className="meta">
                        {ev.model || "n/a"} · in {ev.tokensIn}/out {ev.tokensOut}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {(tab === "dashboard" || tab === "users") && (
            <section className="cv-admin-card">
              <h2>Users</h2>
              <p className="sub">Click a row for activity. Approve mentors/recruiters or suspend abuse.</p>
              <ul className="mt-4 space-y-3">
                {data.recentUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <button type="button" className="min-w-0 text-left" onClick={() => void openUser(u.id)}>
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
                        {u.registration?.track ? ` · ${u.registration.track}` : ""}
                        {u.registration?.companyName ? ` · ${u.registration.companyName}` : ""}
                      </p>
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        id={`roles-${u.id}`}
                        aria-label={`Roles for ${u.email}`}
                        key={`${u.id}-${u.roles.join(",")}`}
                        className="h-9 max-w-[160px] rounded-xl border border-border bg-white px-2 text-xs"
                        defaultValue={
                          u.roles.includes("PLATFORM_ADMIN") ? "PLATFORM_ADMIN" : u.roles[0] || "STUDENT"
                        }
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
                      {u.roles.includes("HR") || u.registration?.track === "hr" ? (
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
                      ) : null}
                      {u.roles.includes("MENTOR") || u.registration?.track === "mentor" ? (
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
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {selectedId && data?.focusedUser ? (
        <>
          <button
            type="button"
            className="cv-admin-drawer-backdrop"
            aria-label="Close user activity"
            onClick={() => setSelectedId(null)}
          />
          <aside className="cv-admin-drawer" aria-label="User activity">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3>{data.focusedUser.name || data.focusedUser.email}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {data.focusedUser.email} · {data.focusedUser.roles.join(", ")}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </div>
            <h4 className="mt-5 text-sm font-semibold">Activity</h4>
            <div className="cv-admin-feed">
              {data.focusedUser.activity.map((ev) => (
                <div key={ev.id} className="row">
                  <div className="title">{ev.name}</div>
                  <div className="meta">
                    {ev.createdAt ? ev.createdAt.slice(0, 19).replace("T", " ") : "—"}
                  </div>
                </div>
              ))}
              {!data.focusedUser.activity.length ? (
                <p className="text-sm text-muted-foreground">No tracked events for this user yet.</p>
              ) : null}
            </div>
            <h4 className="mt-5 text-sm font-semibold">AI usage</h4>
            <div className="cv-admin-feed">
              {data.focusedUser.aiUsage.map((ev) => (
                <div key={ev.id} className="row">
                  <div className="title">
                    {ev.operation}
                    {!ev.success ? " · failed" : ""}
                  </div>
                  <div className="meta">{ev.createdAt ? ev.createdAt.slice(0, 19).replace("T", " ") : "—"}</div>
                </div>
              ))}
              {!data.focusedUser.aiUsage.length ? (
                <p className="text-sm text-muted-foreground">No AI usage for this user.</p>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-2xl" />}>
      <AdminConsoleInner />
    </Suspense>
  );
}
