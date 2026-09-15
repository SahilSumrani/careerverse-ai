"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";
import type { RoleName } from "@/lib/roles";

import { AdminKpiCards } from "./components/AdminKpiCards";
import { PendingApprovalsQueue, type PendingItem } from "./components/PendingApprovalsQueue";
import { UserAccountDirectory, type AdminUserRow } from "./components/UserAccountDirectory";
import { DonutGauge } from "./components/DonutGauge";
import { AiOperationLogs, type AiUsageEvent } from "./components/AiOperationLogs";
import { UserInspectionDrawer, type FocusedUser } from "./components/UserInspectionDrawer";

type Track = "student" | "mentor" | "recruiter";

type AdminPayload = {
  overview: {
    users: number;
    applications: number;
    opportunities: number;
    aiEventsToday: number;
  };
  recentUsers: AdminUserRow[];
  locationBreakdown: Array<{ location: string; count: number }>;
  aiUsage: AiUsageEvent[];
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
  pendingQueue: PendingItem[];
  recentActivity: Array<{
    id: string;
    name: string;
    userId: string | null;
    props: Record<string, unknown> | null;
    createdAt: string | null;
  }>;
  flags: Array<{ id: string; severity: "warning" | "critical"; label: string; userId?: string }>;
  focusedUser: FocusedUser | null;
  chatLimits: { dailyCap: number; maxInputChars: number };
  note?: string;
  serverTime?: string;
};

const POLL_MS = 15_000;

function AdminConsoleInner() {
  const [data, setData] = useState<AdminPayload | null>(null);
  const [, setLoading] = useState(true);
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

      {/* 4 Modern Pastel KPI Cards */}
      <AdminKpiCards overview={data?.overview} />

      {/* Approvals & Registration Breakdown Row */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left 8-cols: Pending Approvals Queue & User Directory */}
        <div className="space-y-6 lg:col-span-8">
          <PendingApprovalsQueue
            queue={data?.pendingQueue || []}
            busyId={busyId}
            onOpenUser={openUser}
            onApprove={(row) =>
              void postAction(
                { action: row.kind === "mentor" ? "approve_mentor" : "approve_recruiter", id: row.id },
                row.id
              )
            }
          />

          <UserAccountDirectory
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredUsers={filteredUsers}
            busyId={busyId}
            onOpenUser={openUser}
            onSetRole={(id, role) => void postAction({ action: "set_roles", id, roles: [role] }, id)}
            onSuspend={(id) => void postAction({ action: "suspend_user", id }, id)}
            onUnsuspend={(id) => void postAction({ action: "unsuspend_user", id }, id)}
          />
        </div>

        {/* Right 4-cols: Donut Registration Mix & AI Operation Logs */}
        <div className="space-y-6 lg:col-span-4">
          <DonutGauge
            students={rb?.students ?? 0}
            mentors={rb?.mentors ?? 0}
            recruiters={rb?.recruiters ?? 0}
            pendingMentors={rb?.pendingMentors}
            pendingRecruiters={rb?.pendingRecruiters}
          />

          <AiOperationLogs logs={data?.aiUsage || []} />
        </div>
      </div>

      {/* User Inspection Modal Drawer */}
      <UserInspectionDrawer
        focusedUser={selectedId && data?.focusedUser ? data.focusedUser : null}
        onClose={() => setSelectedId(null)}
      />
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
