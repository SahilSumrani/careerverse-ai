"use client";

import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "../../types/resume";

interface AchievementsFormProps {
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
}

export function AchievementsForm({ register, control }: AchievementsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyAchievements",
  });

  return (
    <div className="space-y-3.5 animate-in fade-in">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 relative space-y-2"
        >
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove achievement ${index + 1}`}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
          >
            <Trash2 size={15} />
          </button>

          <div className="pr-7 space-y-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Achievement Title
              </label>
              <input
                {...register(`keyAchievements.${index}.title`)}
                placeholder="e.g. Winner - National Hackathon 2024"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Description & Impact
              </label>
              <textarea
                rows={2}
                {...register(`keyAchievements.${index}.description`)}
                placeholder="Built an AI healthcare triage tool among 500+ participants..."
                className="w-full p-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ title: "", description: "" })}
        aria-label="Add key achievement entry"
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-xs font-semibold cursor-pointer transition-colors"
      >
        <Plus size={15} /> Add Key Achievement
      </button>
    </div>
  );
}
