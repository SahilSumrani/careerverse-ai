"use client";

import { Control, UseFormRegister, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "../../types/resume";
import { TagInput } from "../TagInput";

interface ProjectsFormProps {
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
}

export function ProjectsForm({ register, control }: ProjectsFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "projects",
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
            aria-label={`Remove project ${index + 1}`}
            className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
          >
            <Trash2 size={16} />
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-7">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Project Name
              </label>
              <input
                {...register(`projects.${index}.name`)}
                placeholder="e.g. CareerVerse AI Platform"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Project Link / Demo (Optional)
              </label>
              <input
                {...register(`projects.${index}.link`)}
                placeholder="https://github.com/... or live demo"
                className="w-full p-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <Controller
              control={control}
              name={`projects.${index}.technologies`}
              render={({ field: { value, onChange } }) => (
                <TagInput
                  label="Technologies Used"
                  tags={value || []}
                  onChange={onChange}
                  placeholder="e.g. React, Next.js, Node.js"
                />
              )}
            />
          </div>

          {/* Controlled bullet points */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Key Highlights / Features (one per line)
              </label>
              <span className="text-[10px] text-slate-400">
                What did you build & what was the outcome?
              </span>
            </div>
            <Controller
              control={control}
              name={`projects.${index}.description`}
              render={({ field: { value, onChange } }) => (
                <textarea
                  rows={3}
                  value={Array.isArray(value) ? value.join("\n") : ""}
                  onChange={(e) => {
                    const lines = e.target.value.split("\n");
                    onChange(lines);
                  }}
                  placeholder="Engineered an interactive resume builder with real-time A4 preview...&#10;Integrated AI voice assistant for sub-second ATS resume optimization..."
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
            name: "",
            technologies: [],
            link: "",
            description: [],
          })
        }
        aria-label="Add project entry"
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 text-xs font-semibold cursor-pointer transition-colors"
      >
        <Plus size={15} /> Add Project
      </button>
    </div>
  );
}
