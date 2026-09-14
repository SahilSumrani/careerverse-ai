"use client";

import { UseFormRegister } from "react-hook-form";
import { ResumeData } from "../../types/resume";

interface PersonalInfoFormProps {
  register: UseFormRegister<ResumeData>;
}

export function PersonalInfoForm({ register }: PersonalInfoFormProps) {
  return (
    <div className="space-y-3.5 animate-in fade-in">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Full Name
        </label>
        <input
          {...register("personalInfo.fullName")}
          placeholder="e.g. Alex Morgan"
          className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Headline / Role Title
        </label>
        <input
          {...register("personalInfo.headline")}
          placeholder="e.g. Full Stack Developer | Modern Web Technologies"
          className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register("personalInfo.email")}
            placeholder="alex.morgan@example.com"
            className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            {...register("personalInfo.phone")}
            placeholder="+1 (555) 019-2834"
            className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Location
          </label>
          <input
            {...register("personalInfo.location")}
            placeholder="e.g. San Francisco, CA"
            className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            LinkedIn URL
          </label>
          <input
            {...register("personalInfo.linkedin")}
            placeholder="linkedin.com/in/alex-morgan"
            className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          GitHub / Portfolio URL (Optional)
        </label>
        <input
          {...register("personalInfo.github")}
          placeholder="github.com/alexmorgan"
          className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
        />
      </div>
    </div>
  );
}
