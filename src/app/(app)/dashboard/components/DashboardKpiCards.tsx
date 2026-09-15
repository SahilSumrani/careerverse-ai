import Link from "next/link";
import {
  Sparkles,
  ClipboardList,
  FileText,
  Calendar,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface DashboardKpiCardsProps {
  careerScore: number;
  applicationsCount: number;
  resumeScore?: number | null;
  hasResume: boolean;
  mentorshipSessionsCount: number;
}

export function DashboardKpiCards({
  careerScore,
  applicationsCount,
  resumeScore,
  hasResume,
  mentorshipSessionsCount,
}: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Lavender/Purple - AI Career Score */}
      <div className="p-5 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50/70 to-indigo-50/40 shadow-2xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
            <Sparkles size={20} />
          </div>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md">
            Top 20%
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900">{careerScore}/100</h3>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">AI Career Intelligence</p>
        </div>
        <p className="text-[11px] text-purple-800 font-medium mt-2 pt-2 border-t border-purple-100/80 flex items-center gap-1">
          <CheckCircle2 size={13} className="text-purple-600" />
          Verified skills fit & gaps
        </p>
      </div>

      {/* Card 2: Peach/Amber - Active Applications */}
      <div className="p-5 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 to-orange-50/40 shadow-2xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
            <ClipboardList size={20} />
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
            Firestore Live
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900">{applicationsCount}</h3>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">Active Applications</p>
        </div>
        <Link
          href="/applications"
          className="text-[11px] text-amber-900 font-medium mt-2 pt-2 border-t border-amber-100/80 hover:text-amber-700 flex items-center justify-between"
        >
          <span>View application pipeline</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Card 3: Rose/Pink - ATS Resume Status */}
      <div className="p-5 rounded-2xl border border-rose-100 bg-linear-to-br from-rose-50/70 to-pink-50/40 shadow-2xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-2xs">
            <FileText size={20} />
          </div>
          <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
            {hasResume ? "Ready" : "Incomplete"}
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900">
            {resumeScore ? `${resumeScore}%` : "A4 Ready"}
          </h3>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">Resume ATS Health</p>
        </div>
        <Link
          href="/create-resume"
          className="text-[11px] text-rose-800 font-medium mt-2 pt-2 border-t border-rose-100/80 hover:text-rose-900 flex items-center justify-between"
        >
          <span>Edit in Resume Builder</span>
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* Card 4: Sky Blue/Mint - Mentorship Sessions */}
      <div className="p-5 rounded-2xl border border-sky-100 bg-linear-to-br from-sky-50/70 to-teal-50/40 shadow-2xs flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shadow-2xs">
            <Calendar size={20} />
          </div>
          <span className="text-[11px] font-bold text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-md">
            1-on-1 Mentors
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-extrabold text-slate-900">
            {mentorshipSessionsCount}
          </h3>
          <p className="text-xs font-semibold text-slate-600 mt-0.5">Booked Sessions</p>
        </div>
        <Link
          href="/mentors"
          className="text-[11px] text-sky-800 font-medium mt-2 pt-2 border-t border-sky-100/80 hover:text-sky-900 flex items-center justify-between"
        >
          <span>Schedule new session</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
