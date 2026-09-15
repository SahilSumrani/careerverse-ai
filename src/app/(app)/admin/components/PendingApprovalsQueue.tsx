import { CheckCircle } from "lucide-react";

export type PendingItem = {
  id: string;
  name: string | null;
  email: string;
  kind: "mentor" | "recruiter";
  companyName: string | null;
  expertise: string | null;
  careerScore: number | null;
  createdAt: string | null;
};

interface PendingApprovalsQueueProps {
  queue: PendingItem[];
  busyId: string | null;
  onOpenUser: (id: string) => void;
  onApprove: (row: PendingItem) => void;
}

export function PendingApprovalsQueue({
  queue,
  busyId,
  onOpenUser,
  onApprove,
}: PendingApprovalsQueueProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pending Approvals Queue</h2>
          <p className="text-xs text-slate-500">
            Mentors and Recruiters awaiting verification before platform access unlocks.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
          {queue.length} In Waiting
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {queue.length ? (
          queue.map((row) => (
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
                  onClick={() => onOpenUser(row.id)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  disabled={busyId === row.id}
                  onClick={() => onApprove(row)}
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
  );
}
