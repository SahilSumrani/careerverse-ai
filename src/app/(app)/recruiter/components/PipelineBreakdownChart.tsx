import type { RecruiterStats } from "./RecruiterKpiCards";

interface PipelineBreakdownChartProps {
  stats: RecruiterStats;
}

export function PipelineBreakdownChart({ stats }: PipelineBreakdownChartProps) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">Pipeline Breakdown</h3>
      <p className="text-xs text-slate-500">Real-time candidate progression</p>

      <div className="mt-6 flex flex-col items-center">
        {/* Donut SVG */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" stroke="#f1f5f9" strokeWidth="10" fill="none" />
            {/* Segment 1: Review (Amber) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#f59e0b"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${Math.max(
                (stats.review / Math.max(stats.total, 1)) * 238.7,
                2
              )} 238.7`}
              strokeLinecap="round"
            />
            {/* Segment 2: Interview (Violet) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#8b5cf6"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${Math.max(
                (stats.interview / Math.max(stats.total, 1)) * 238.7,
                2
              )} 238.7`}
              strokeDashoffset={-((stats.review / Math.max(stats.total, 1)) * 238.7)}
              strokeLinecap="round"
            />
            {/* Segment 3: Hired (Emerald) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              stroke="#10b981"
              strokeWidth="10"
              fill="none"
              strokeDasharray={`${Math.max(
                (stats.hired / Math.max(stats.total, 1)) * 238.7,
                2
              )} 238.7`}
              strokeDashoffset={
                -(((stats.review + stats.interview) / Math.max(stats.total, 1)) * 238.7)
              }
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Flow
            </span>
          </div>
        </div>

        {/* Legends with colored indicator dots */}
        <div className="mt-6 w-full space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-700">In Review</span>
            </div>
            <span className="font-bold text-slate-900">{stats.review}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-violet-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <span className="font-semibold text-slate-700">Interview Stage</span>
            </div>
            <span className="font-bold text-slate-900">{stats.interview}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">Hired & Placed</span>
            </div>
            <span className="font-bold text-slate-900">{stats.hired}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
