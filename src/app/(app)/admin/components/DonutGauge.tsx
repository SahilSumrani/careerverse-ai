interface DonutGaugeProps {
  students: number;
  mentors: number;
  recruiters: number;
  pendingMentors?: number;
  pendingRecruiters?: number;
}

export function DonutGauge({
  students,
  mentors,
  recruiters,
  pendingMentors,
  pendingRecruiters,
}: DonutGaugeProps) {
  const total = Math.max(students + mentors + recruiters, 1);
  const sDeg = (students / total) * 360;
  const mDeg = (mentors / total) * 360;

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">User Demographics</h3>
      <p className="text-xs text-slate-500">Distribution across platform tracks</p>

      <div className="mt-5 flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="36" stroke="#f1f5f9" strokeWidth="12" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="36"
              stroke="#6366f1"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(sDeg / 360) * 226.2} 226.2`}
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="36"
              stroke="#ec4899"
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(mDeg / 360) * 226.2} 226.2`}
              strokeDashoffset={-((sDeg / 360) * 226.2)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-slate-900">{total}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          </div>
        </div>

        <div className="mt-5 w-full space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-xl bg-indigo-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="font-semibold text-slate-700">Students</span>
            </div>
            <span className="font-bold text-slate-900">{students}</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-pink-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-pink-500" />
              <span className="font-semibold text-slate-700">Mentors</span>
            </div>
            <span className="font-bold text-slate-900">
              {mentors}{" "}
              {pendingMentors ? (
                <span className="text-[10px] text-pink-600 font-bold">({pendingMentors} pending)</span>
              ) : null}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-semibold text-slate-700">Recruiters</span>
            </div>
            <span className="font-bold text-slate-900">
              {recruiters}{" "}
              {pendingRecruiters ? (
                <span className="text-[10px] text-amber-600 font-bold">({pendingRecruiters} pending)</span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
