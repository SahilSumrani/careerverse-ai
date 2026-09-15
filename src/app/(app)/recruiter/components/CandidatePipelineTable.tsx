import { Search, Sparkles, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/states";

export type Applicant = {
  id: string;
  status: string;
  userId?: string;
  applicant?: { name?: string | null; email?: string | null } | null;
  opportunity?: { title?: string; organizationName?: string };
  updatedAt?: string;
  matchScore?: number | null;
  careerScore?: number | null;
  skills?: string[];
  matchReasons?: string[];
};

interface CandidatePipelineTableProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  searchFilter: string;
  setSearchFilter: (query: string) => void;
  loading: boolean;
  filteredApplicants: Applicant[];
  updatingId: string | null;
  onSetStatus: (id: string, status: string) => void;
}

export function CandidatePipelineTable({
  statusFilter,
  setStatusFilter,
  searchFilter,
  setSearchFilter,
  loading,
  filteredApplicants,
  updatingId,
  onSetStatus,
}: CandidatePipelineTableProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Candidate Pipeline</h2>
          <p className="text-xs text-slate-500">
            Manage application stages, review AI match scores, and make hiring decisions.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1">
          {["ALL", "ASSESSMENT", "INTERVIEW", "OFFER", "HIRED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st === "ALL" ? "All" : st === "ASSESSMENT" ? "Review" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate by name, email, or role..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
      </div>

      {/* Applicants Table */}
      <div className="mt-6 overflow-x-auto">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        ) : filteredApplicants.length ? (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-semibold uppercase tracking-wider">Candidate</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Applied Role</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Match Score</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Status</th>
                <th className="pb-3 text-right font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApplicants.map((a) => {
                const name = a.applicant?.name || a.applicant?.email || "Candidate";
                const initials = name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <tr key={a.id} className="group hover:bg-slate-50/60 transition">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 font-bold text-indigo-700 shadow-xs">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{name}</p>
                          <p className="text-[11px] text-slate-400">{a.applicant?.email || "No email"}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 font-semibold text-slate-700">
                      {a.opportunity?.title || "Application"}
                    </td>

                    <td className="py-4">
                      <div className="flex items-center gap-1.5">
                        {a.matchScore != null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200/60">
                            <Sparkles className="h-3 w-3" />
                            {a.matchScore}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                        {a.careerScore != null && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700 border border-violet-200/50">
                            {a.careerScore} pts
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                          a.status === "HIRED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : a.status === "OFFER"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : a.status === "INTERVIEW"
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : a.status === "ASSESSMENT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : a.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            a.status === "HIRED"
                              ? "bg-emerald-500"
                              : a.status === "OFFER"
                              ? "bg-blue-500"
                              : a.status === "INTERVIEW"
                              ? "bg-violet-500"
                              : a.status === "ASSESSMENT"
                              ? "bg-amber-500"
                              : a.status === "REJECTED"
                              ? "bg-rose-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {a.status === "ASSESSMENT" ? "In Review" : a.status}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.status !== "INTERVIEW" && a.status !== "HIRED" && (
                          <button
                            type="button"
                            disabled={updatingId === a.id}
                            onClick={() => void onSetStatus(a.id, "INTERVIEW")}
                            className="rounded-xl border border-violet-200 bg-violet-50/80 px-2.5 py-1 font-bold text-violet-700 hover:bg-violet-100 transition"
                          >
                            Interview
                          </button>
                        )}
                        {a.status !== "HIRED" && (
                          <button
                            type="button"
                            disabled={updatingId === a.id}
                            onClick={() => void onSetStatus(a.id, "HIRED")}
                            className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 font-bold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            Hire
                          </button>
                        )}
                        {a.status !== "REJECTED" && (
                          <button
                            type="button"
                            disabled={updatingId === a.id}
                            onClick={() => void onSetStatus(a.id, "REJECTED")}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-800">No applicants found</p>
            <p className="mt-1 text-xs text-slate-500">
              Share your job links or browse Top Talent to invite candidates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
