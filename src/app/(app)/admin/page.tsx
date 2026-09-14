"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Briefcase,
  FileText,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  RefreshCw,
  Clock,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  UserX,
  X,
  Activity,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import { ROLE_NAMES, type RoleName } from "@/lib/roles";

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
    careerScore?: number | null;
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
  pendingQueue: Array<{
    id: string;
    name: string | null;
    email: string;
    kind: "mentor" | "recruiter";
    companyName: string | null;
    expertise: string | null;
    careerScore: number | null;
    createdAt: string | null;
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

const POLL_MS = 15_000;

function DonutGauge({
  students,
  mentors,
  recruiters,
}: {
  students: number;
  mentors: number;
  recruiters: number;
}) {
  const total = Math.max(students + mentors + recruiters, 1);
  const r = 38;
  const c = 2 * Math.PI * r;
  const s1 = (students / total) * c;
  const s2 = (mentors / total) * c;
  const s3 = (recruiters / total) * c;

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} stroke="#f1f5f9" strokeWidth="10" fill="none" />
        {/* Students (Indigo) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#6366f1"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${Math.max(s1, 1)} ${c - Math.max(s1, 1)}`}
          strokeLinecap="round"
        />
        {/* Mentors (Pink) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#ec4899"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${Math.max(s2, 1)} ${c - Math.max(s2, 1)}`}
          strokeDashoffset={-s1}
          strokeLinecap="round"
        />
        {/* Recruiters (Amber) */}
        <circle
          cx="50"
          cy="50"
          r={r}
          stroke="#f59e0b"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${Math.max(s3, 1)} ${c - Math.max(s3, 1)}`}
          strokeDashoffset={-(s1 + s2)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black text-slate-900">{total}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
      </div>
    </div>
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
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

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

  // Filtered users
  const filteredUsers = useMemo(() => {
    if (!data?.recentUsers) return [];
    return data.recentUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query || name.includes(query) || email.includes(query);
      const matchesRole =
        roleFilter === "ALL" ||
        u.roles.includes(roleFilter as RoleName) ||
        (roleFilter === "PENDING" && (u.registration?.track && !u.recruiterApproved && !u.mentorApproved));
      return matchesSearch && matchesRole;
    });
  }, [data?.recentUsers, searchQuery, roleFilter]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Live Polling Indicator */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Platform Command Center</h1>
            <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
              Admin Access
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time telemetry, role governance, approvals queue, and token consumption.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Synced: {lastRefresh || "Connecting…"}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-2xl border-slate-200 text-xs font-bold text-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {/* 4 Modern Pastel KPI Cards (Matches Reference Mockups) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Lavender (Total Registered Members) */}
        <div className="rounded-3xl border border-violet-100/80 bg-violet-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-violet-700 shadow-xs">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600/90">
              Total Platform Users
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">{data?.overview.users ?? 0}</p>
            <p className="mt-1 text-xs text-violet-700/80">Active accounts registered</p>
          </div>
        </div>

        {/* Card 2: Amber / Peach (Applications In Pipeline) */}
        <div className="rounded-3xl border border-amber-100/80 bg-amber-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-xs">
              Flow
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/90">
              Job Applications
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {data?.overview.applications ?? 0}
            </p>
            <p className="mt-1 text-xs text-amber-700/80">Submitted by students</p>
          </div>
        </div>

        {/* Card 3: Rose / Pink (Active Job Postings) */}
        <div className="rounded-3xl border border-rose-100/80 bg-rose-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
              <Briefcase className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-xs">
              Board
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600/90">
              Published Jobs
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {data?.overview.opportunities ?? 0}
            </p>
            <p className="mt-1 text-xs text-rose-700/80">Verified company postings</p>
          </div>
        </div>

        {/* Card 4: Sky / Cyan (AI Events & Tokens) */}
        <div className="rounded-3xl border border-sky-100/80 bg-sky-50/80 p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-sky-700 shadow-xs">
              Daily Ops
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-600/90">
              AI Events Today
            </p>
            <p className="mt-1 text-3xl font-black text-slate-900">
              {data?.overview.aiEventsToday ?? 0}
            </p>
            <p className="mt-1 text-xs text-sky-700/80">Resume scoring & copilot</p>
          </div>
        </div>
      </div>

      {/* Approvals & Registration Breakdown Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 8-cols: Pending Approvals Queue (High Priority) */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pending Approvals Queue</h2>
                <p className="text-xs text-slate-500">
                  Mentors and Recruiters awaiting verification before platform access unlocks.
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                {data?.pendingQueue.length ?? 0} In Waiting
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {data?.pendingQueue.length ? (
                data.pendingQueue.map((row) => (
                  <div
                    key={`${row.kind}-${row.id}`}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between transition hover:border-indigo-200 hover:bg-white hover:shadow-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900">{row.name || row.email}</p>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            row.kind === "mentor"
                              ? "bg-violet-100 text-violet-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {row.kind.toUpperCase()}
                        </span>
                      </div>
                      <p className="truncate text-xs text-slate-500 mt-0.5">
                        {row.email}
                        {row.companyName ? ` · Organization: ${row.companyName}` : ""}
                        {row.expertise ? ` · Field: ${row.expertise}` : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => void openUser(row.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Inspect
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() =>
                          void postAction(
                            { action: row.kind === "mentor" ? "approve_mentor" : "approve_recruiter", id: row.id },
                            row.id
                          )
                        }
                        className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {busyId === row.id ? "Approving…" : "Approve"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-400">
                  <CheckCircle className="mx-auto h-7 w-7 text-emerald-400 mb-1" />
                  All recruiter and mentor requests are processed!
                </div>
              )}
            </div>
          </div>

          {/* User Management Directory */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">User Account Directory</h2>
                <p className="text-xs text-slate-500">
                  Inspect registered users, manage role assignments, and govern access.
                </p>
              </div>

              {/* Role Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100/80 p-1">
                {["ALL", "STUDENT", "MENTOR", "HR", "PLATFORM_ADMIN"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                      roleFilter === r
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {r === "ALL" ? "All" : r === "HR" ? "Recruiter" : r === "PLATFORM_ADMIN" ? "Admin" : r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Box */}
            <div className="mt-4 relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or track..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400">
                    <th className="pb-3 font-semibold uppercase tracking-wider">Account</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Track</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Role Assignment</th>
                    <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
                    <th className="pb-3 text-right font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.slice(0, 15).map((u) => {
                    const initials = (u.name || u.email || "U")
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr key={u.id} className="group hover:bg-slate-50/60 transition">
                        <td className="py-3.5">
                          <button
                            type="button"
                            onClick={() => void openUser(u.id)}
                            className="flex items-center gap-3 text-left"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-700">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 hover:text-indigo-600 transition">
                                {u.name || "Unnamed"}
                              </p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                            </div>
                          </button>
                        </td>

                        <td className="py-3.5 font-semibold text-slate-600">
                          {u.registration?.track || "Direct Student"}
                        </td>

                        <td className="py-3.5">
                          <select
                            value={u.roles.includes("PLATFORM_ADMIN") ? "PLATFORM_ADMIN" : u.roles[0] || "STUDENT"}
                            disabled={busyId === u.id}
                            onChange={(e) => {
                              const role = e.target.value as RoleName;
                              void postAction({ action: "set_roles", id: u.id, roles: [role] }, u.id);
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
                          >
                            {ROLE_NAMES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3.5">
                          {u.suspendedAt ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!u.suspendedAt ? (
                              <button
                                type="button"
                                disabled={busyId === u.id}
                                onClick={() => void postAction({ action: "suspend_user", id: u.id }, u.id)}
                                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={busyId === u.id}
                                onClick={() => void postAction({ action: "unsuspend_user", id: u.id }, u.id)}
                                className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
                              >
                                Unsuspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 4-cols: Donut Registration Mix & System Activity Feed */}
        <div className="space-y-6 lg:col-span-4">
          {/* Donut User Mix Card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900">User Demographics</h3>
            <p className="text-xs text-slate-500">Distribution across platform tracks</p>

            <div className="mt-5 flex flex-col items-center">
              <DonutGauge
                students={rb?.students ?? 0}
                mentors={rb?.mentors ?? 0}
                recruiters={rb?.recruiters ?? 0}
              />

              <div className="mt-5 w-full space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-indigo-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-700">Students</span>
                  </div>
                  <span className="font-bold text-slate-900">{rb?.students ?? 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-pink-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-pink-500" />
                    <span className="font-semibold text-slate-700">Mentors</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {rb?.mentors ?? 0}{" "}
                    {rb?.pendingMentors ? (
                      <span className="text-[10px] text-pink-600 font-bold">({rb.pendingMentors} pending)</span>
                    ) : null}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="font-semibold text-slate-700">Recruiters</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {rb?.recruiters ?? 0}{" "}
                    {rb?.pendingRecruiters ? (
                      <span className="text-[10px] text-amber-600 font-bold">({rb.pendingRecruiters} pending)</span>
                    ) : null}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Intelligence & Tokens telemetry */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">AI Operation Logs</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                Live
              </span>
            </div>

            <div className="mt-4 space-y-2.5 max-h-80 overflow-y-auto">
              {data?.aiUsage.slice(0, 6).map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{ev.operation}</span>
                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        ev.success ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {ev.success ? "OK" : "ERR"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Model: {ev.model || "Gemini"} · In: {ev.tokensIn} / Out: {ev.tokensOut}
                  </p>
                </div>
              ))}
              {!data?.aiUsage.length && (
                <p className="py-4 text-center text-xs text-slate-400">No recent AI telemetry.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* User Inspection Modal Drawer */}
      {selectedId && data?.focusedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs p-4">
          <div className="h-full w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {data.focusedUser.name || data.focusedUser.email}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {data.focusedUser.email} · {data.focusedUser.roles.join(", ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Telemetry Events
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {data.focusedUser.activity.map((ev) => (
                    <div key={ev.id} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-xs">
                      <p className="font-bold text-slate-800">{ev.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {ev.createdAt ? ev.createdAt.slice(0, 19).replace("T", " ") : "Timestamped"}
                      </p>
                    </div>
                  ))}
                  {!data.focusedUser.activity.length && (
                    <p className="text-xs text-slate-400">No logged activity recorded for this profile.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <Link
                href={`/admin/users/${encodeURIComponent(data.focusedUser.id)}`}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Full User Profile
              </Link>
              <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Skeleton className="h-40 w-full rounded-3xl" />}>
      <AdminConsoleInner />
    </Suspense>
  );
}
