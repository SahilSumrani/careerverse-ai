import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

interface QuickResumeCardProps {
  resumeFileName?: string | null;
}

export function QuickResumeCard({ resumeFileName }: QuickResumeCardProps) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Interactive Resume</h3>
          <p className="text-xs text-slate-500 mt-0.5">Dual-template real-time editor</p>
        </div>
        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
          <FileText size={18} />
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
        <p className="text-xs font-semibold text-slate-800">
          {resumeFileName ? resumeFileName : "Alex Morgan (Standard ATS Draft)"}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Executive (2-Col) &bull; Classic (1-Col) &bull; Voice AI
        </p>
      </div>

      <div className="mt-4 space-y-2">
        <Link
          href="/create-resume"
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Sparkles size={14} /> Open Resume Builder
        </Link>
        <Link
          href="/resume"
          className="w-full flex items-center justify-center py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          Analyze Existing PDF
        </Link>
      </div>
    </div>
  );
}
