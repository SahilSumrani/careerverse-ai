import { Users, FileText, Briefcase, Sparkles, TrendingUp } from "lucide-react";

interface AdminKpiCardsProps {
  overview?: {
    users: number;
    applications: number;
    opportunities: number;
    aiEventsToday: number;
  };
}

export function AdminKpiCards({ overview }: AdminKpiCardsProps) {
  return (
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
          <p className="mt-1 text-3xl font-black text-slate-900">{overview?.users ?? 0}</p>
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
            {overview?.applications ?? 0}
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
            {overview?.opportunities ?? 0}
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
            {overview?.aiEventsToday ?? 0}
          </p>
          <p className="mt-1 text-xs text-sky-700/80">Resume scoring & copilot</p>
        </div>
      </div>
    </div>
  );
}
