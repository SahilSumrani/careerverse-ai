"use client";

import { Control, UseFormRegister, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "../../types/resume";

interface EducationFormProps {
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
}

export function EducationForm({ register, control }: EducationFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "education",
  });

  return (
    <div className="space-y-4 animate-in fade-in">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 relative space-y-3"
        >
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label={`Remove education ${index + 1}`}
            className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-7">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Institution / University
              </label>
              <input
                {...register(`education.${index}.institution`)}
                placeholder="e.g. State University of California"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Degree / Field of Study
              </label>
              <input
                {...register(`education.${index}.degree`)}
                placeholder="e.g. B.S. in Computer Science"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start Year / Date
              </label>
              <input
                {...register(`education.${index}.startDate`)}
                placeholder="2022"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                End Year / Date
              </label>
              <input
                {...register(`education.${index}.endDate`)}
                placeholder="2026"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                GPA / Percentage (Optional)
              </label>
              <input
                {...register(`education.${index}.score`)}
                placeholder="3.8 GPA or 85%"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            institution: "",
            degree: "",
            startDate: "",
            endDate: "",
            score: "",
            location: "",
          })
        }
        aria-label="Add education entry"
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-xs font-semibold cursor-pointer transition-colors"
      >
        <Plus size={15} /> Add Education
      </button>
    </div>
  );
}
