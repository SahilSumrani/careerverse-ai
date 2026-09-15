import { Briefcase, Users, Video, Award, TrendingUp } from "lucide-react";

export type RecruiterStats = {
  total: number;
  review: number;
  interview: number;
  offer: number;
  hired: number;
};

interface RecruiterKpiCardsProps {
  jobsCount: number;
  stats: RecruiterStats;
}

export function RecruiterKpiCards({ jobsCount, stats }: RecruiterKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Lavender (Active Roles) */}
      <div className="group relative overflow-hidden rounded-3xl border border-violet-100/80 bg-violet-50/80 p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-violet-700 shadow-xs">
            <TrendingUp className="h-3 w-3" /> Active
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600/90">
            Open Positions
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{jobsCount}</p>
          <p className="mt-1 text-xs text-violet-700/80">Live vacancies published</p>
        </div>
      </div>

      {/* Card 2: Peach / Amber (Total Applicants) */}
      <div className="group relative overflow-hidden rounded-3xl border border-amber-100/80 bg-amber-50/80 p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm">
            <Users className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-amber-700 shadow-xs">
            Pipeline
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600/90">
            Total Applicants
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-amber-700/80">Across all posted jobs</p>
        </div>
      </div>

      {/* Card 3: Rose / Pink (In Interview) */}
      <div className="group relative overflow-hidden rounded-3xl border border-rose-100/80 bg-rose-50/80 p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-sm">
            <Video className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-rose-700 shadow-xs">
            Rounds
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-600/90">
            In Interview
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{stats.interview}</p>
          <p className="mt-1 text-xs text-rose-700/80">Candidates progressing</p>
        </div>
      </div>

      {/* Card 4: Sky / Cyan (Hired) */}
      <div className="group relative overflow-hidden rounded-3xl border border-sky-100/80 bg-sky-50/80 p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-sm">
            <Award className="h-5 w-5" />
          </div>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-sky-700 shadow-xs">
            Offers
          </span>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-600/90">
            Total Hires
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{stats.hired}</p>
          <p className="mt-1 text-xs text-sky-700/80">Successful placements</p>
        </div>
      </div>
    </div>
  );
}
