import { Search } from "lucide-react";
import { ROLE_NAMES, type RoleName } from "@/lib/roles";

export type AdminUserRow = {
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
};

interface UserAccountDirectoryProps {
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredUsers: AdminUserRow[];
  busyId: string | null;
  onOpenUser: (id: string) => void;
  onSetRole: (id: string, role: RoleName) => void;
  onSuspend: (id: string) => void;
  onUnsuspend: (id: string) => void;
}

export function UserAccountDirectory({
  roleFilter,
  setRoleFilter,
  searchQuery,
  setSearchQuery,
  filteredUsers,
  busyId,
  onOpenUser,
  onSetRole,
  onSuspend,
  onUnsuspend,
}: UserAccountDirectoryProps) {
  return (
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
                      onClick={() => onOpenUser(u.id)}
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
                        onSetRole(u.id, role);
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
                          onClick={() => onSuspend(u.id)}
                          className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyId === u.id}
                          onClick={() => onUnsuspend(u.id)}
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
  );
}
