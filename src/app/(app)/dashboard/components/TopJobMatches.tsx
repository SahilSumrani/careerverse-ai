import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { JobListing } from "@/lib/jobs-firestore";

export interface MatchedJobItem {
  job: JobListing;
  match: { score: number; reasons: string[] } | null;
}

interface TopJobMatchesProps {
  matched: MatchedJobItem[];
  totalJobsCount: number;
}

export function TopJobMatches({ matched, totalJobsCount }: TopJobMatchesProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Top Matches for You</h2>
          <p className="text-xs text-slate-500">Matched from live Firestore job listings</p>
        </div>
        <Link href="/opportunities/browse" className="text-xs font-bold text-blue-600 hover:text-blue-800">
          Browse All ({totalJobsCount}) &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {matched.map(({ job, match }) => (
          <div
            key={job.id}
            className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{job.title}</h4>
                {match && (
                  <span className="shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {match.score}% Match
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-600 mt-1">
                {job.company} &bull; {job.location}
              </p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {job.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">{job.type}</span>
              <Link
                href="/opportunities/browse"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
              >
                Apply Now <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
