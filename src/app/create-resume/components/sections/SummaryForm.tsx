"use client";

import { UseFormRegister } from "react-hook-form";
import { ResumeData } from "../../types/resume";

interface SummaryFormProps {
  register: UseFormRegister<ResumeData>;
}

export function SummaryForm({ register }: SummaryFormProps) {
  return (
    <div className="space-y-3.5 animate-in fade-in">
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-semibold text-slate-700">
            Professional Summary
          </label>
          <span className="text-[11px] text-slate-400">
            2-4 impactful sentences
          </span>
        </div>
        <textarea
          {...register("professionalSummary")}
          rows={6}
          placeholder="Passionate web developer proficient in JavaScript, React, and Node.js, building responsive full-stack applications that boost user engagement by up to 30%..."
          className="w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 leading-relaxed bg-white"
        />
        <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
          Tip: Highlight your core expertise, notable tech stack, and measurable impact.
        </p>
      </div>
    </div>
  );
}
