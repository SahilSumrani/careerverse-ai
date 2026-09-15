import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { JobRow } from "./TalentPoolSection";

interface ActiveJobsListProps {
  jobs: JobRow[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
}

export function ActiveJobsList({
  jobs,
  selectedJobId,
  setSelectedJobId,
}: ActiveJobsListProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Your Active Jobs</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
          {jobs.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {jobs.length ? (
          jobs.map((j) => (
            <div
              key={j.id}
              onClick={() => setSelectedJobId(j.id)}
              className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                selectedJobId === j.id
                  ? "border-indigo-500 bg-indigo-50/30 shadow-xs"
                  : "border-slate-100 bg-slate-50/40 hover:border-slate-200 hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-slate-900">{j.title}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Active
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {j.organizationName} · {j.location}
              </p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <span className="font-semibold text-indigo-600">{j.type}</span>
                <Link
                  href={`/opportunities/${j.id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  Public page <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            You haven&apos;t posted any roles yet.
          </div>
        )}
      </div>
    </div>
  );
}
