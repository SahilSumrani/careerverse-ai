import { Copy } from "lucide-react";

export type JobRow = {
  id: string;
  title: string;
  organizationName: string;
  type: string;
  location: string;
};

export type Talent = {
  id: string;
  name: string | null;
  careerScore: number;
  skills: string[];
  percentileBand: string;
  matchScore?: number | null;
  matchReasons?: string[];
};

interface TalentPoolSectionProps {
  jobs: JobRow[];
  talent: Talent[];
  selectedJobId: string;
  setSelectedJobId: (id: string) => void;
  onCopyJobLink: () => void;
  copied: boolean;
}

export function TalentPoolSection({
  jobs,
  talent,
  selectedJobId,
  setSelectedJobId,
  onCopyJobLink,
  copied,
}: TalentPoolSectionProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Top Talent Sourcing Pool</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
              Top 20%
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pre-screened students scoring 90+ career readiness with verified skill match.
          </p>
        </div>

        {jobs.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  Match against: {j.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {talent.length ? (
          talent.slice(0, 6).map((cand) => (
            <div
              key={cand.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-indigo-200 hover:bg-white hover:shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900">{cand.name || "Student Candidate"}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                    Score {cand.careerScore}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {cand.matchScore != null ? (
                    <span className="font-semibold text-emerald-600">
                      {cand.matchScore}% skill alignment
                    </span>
                  ) : (
                    "Top quintile candidate"
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {cand.skills.slice(0, 4).map((s) => (
                    <span
                      key={s}
                      className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
                <span className="text-[11px] font-bold text-indigo-600">Verified Profile</span>
                <button
                  type="button"
                  onClick={onCopyJobLink}
                  className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition"
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Link Copied!" : "Invite Link"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-8 text-center text-xs text-slate-400">
            No scored students currently match this role.
          </div>
        )}
      </div>
    </div>
  );
}
