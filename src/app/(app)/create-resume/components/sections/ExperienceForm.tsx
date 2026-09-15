"use client";

import { Control, UseFormRegister, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "../../types/resume";

interface ExperienceFormProps {
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
}

export function ExperienceForm({ register, control }: ExperienceFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "experience",
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
            aria-label={`Remove experience ${index + 1}`}
            className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-7">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Company / Organization
              </label>
              <input
                {...register(`experience.${index}.company`)}
                placeholder="e.g. TechNova Solutions"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Position / Role
              </label>
              <input
                {...register(`experience.${index}.position`)}
                placeholder="e.g. Frontend Developer"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Start Date
              </label>
              <input
                {...register(`experience.${index}.startDate`)}
                placeholder="06/2023"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                End Date
              </label>
              <input
                {...register(`experience.${index}.endDate`)}
                placeholder="Present"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Location
              </label>
              <input
                {...register(`experience.${index}.location`)}
                placeholder="San Francisco, CA"
                className="w-full p-1.5 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Controlled bullet points textarea via Controller */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Bullet Points (one bullet per line)
              </label>
              <span className="text-[10px] text-slate-400">
                Use action verbs & numbers
              </span>
            </div>
            <Controller
              control={control}
              name={`experience.${index}.description`}
              render={({ field: { value, onChange } }) => (
                <textarea
                  rows={4}
                  value={Array.isArray(value) ? value.join("\n") : ""}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    onChange(lines);
                  }}
                  placeholder="Collaborated with cross-functional teams to outline UI requirements...&#10;Engineered automated testing pipelines reducing review cycle by 30%..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 leading-relaxed font-mono text-slate-800"
                />
              )}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          append({
            company: "",
            position: "",
            startDate: "",
            endDate: "",
            location: "",
            description: [],
          })
        }
        aria-label="Add work experience entry"
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-xs font-semibold cursor-pointer transition-colors"
      >
        <Plus size={15} /> Add Work Experience
      </button>
    </div>
  );
}
