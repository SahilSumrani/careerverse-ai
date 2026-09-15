import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

interface ProfileReadinessDonutProps {
  profileCompleteness: number;
  hasResume: boolean;
  skillsCount: number;
  hasDegree: boolean;
}

export function ProfileReadinessDonut({
  profileCompleteness,
  hasResume,
  skillsCount,
  hasDegree,
}: ProfileReadinessDonutProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <h3 className="text-sm font-bold text-slate-900 mb-1">Profile Health & Readiness</h3>
      <p className="text-xs text-slate-500 mb-4">Complete your profile to unlock Top Talent status</p>

      <div className="flex flex-col items-center py-2">
        {/* Circular SVG Donut Chart */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#2563eb"
              strokeWidth="12"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 * (1 - profileCompleteness / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-slate-900">{profileCompleteness}%</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Ready</span>
          </div>
        </div>

        {/* Progress items breakdown */}
        <div className="w-full space-y-2.5 mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} className={hasResume ? "text-emerald-500" : "text-slate-300"} />
              ATS Resume Created
            </span>
            <span className="font-bold text-slate-800">{hasResume ? "Done" : "Missing"}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} className={skillsCount ? "text-emerald-500" : "text-slate-300"} />
              Technical Skills Added
            </span>
            <span className="font-bold text-slate-800">{skillsCount} skills</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} className={hasDegree ? "text-emerald-500" : "text-slate-300"} />
              Education & Degree
            </span>
            <span className="font-bold text-slate-800">{hasDegree ? "Verified" : "Missing"}</span>
          </div>
        </div>

        <Link
          href="/profile"
          className="w-full mt-5 py-2.5 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
        >
          Complete Full Profile &rarr;
        </Link>
      </div>
    </div>
  );
}
