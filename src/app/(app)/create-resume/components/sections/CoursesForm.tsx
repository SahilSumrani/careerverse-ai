"use client";

import { Control, UseFormRegister, useFieldArray, Controller } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResumeData } from "../../types/resume";
import { TagInput } from "../TagInput";

interface CoursesFormProps {
  register: UseFormRegister<ResumeData>;
  control: Control<ResumeData>;
}

export function CoursesForm({ register, control }: CoursesFormProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "trainingCourses",
  });

  return (
    <div className="space-y-5 animate-in fade-in">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
          Trainings & Certifications
        </h3>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 relative space-y-2"
            >
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove course ${index + 1}`}
                className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
              >
                <Trash2 size={15} />
              </button>

              <div className="pr-7 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Course / Training Title
                    </label>
                    <input
                      {...register(`trainingCourses.${index}.name`)}
                      placeholder="e.g. Full Stack Web Development"
                      className="w-full p-1.5 text-xs border border-slate-300 rounded-md bg-white font-medium focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Issuer / Platform
                    </label>
                    <input
                      {...register(`trainingCourses.${index}.issuer`)}
                      placeholder="e.g. Coursera / Meta"
                      className="w-full p-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Duration (Years / Months)
                    </label>
                    <input
                      {...register(`trainingCourses.${index}.durationYears`)}
                      placeholder="e.g. 6 Months or 1 Year"
                      className="w-full p-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                      Completion Year
                    </label>
                    <input
                      {...register(`trainingCourses.${index}.year`)}
                      placeholder="e.g. 2024"
                      className="w-full p-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() =>
              append({
                name: "",
                issuer: "",
                durationYears: "",
                year: "",
              })
            }
            aria-label="Add course or certification"
            className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 text-xs font-medium cursor-pointer transition-colors"
          >
            <Plus size={14} /> Add Training / Course
          </button>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-200">
        <Controller
          control={control}
          name="languages"
          render={({ field: { value, onChange } }) => (
            <TagInput
              label="Spoken Languages"
              tags={value || []}
              onChange={onChange}
              placeholder="e.g. English, Hindi, Spanish"
              badgeColor="bg-purple-50 text-purple-800 border-purple-200"
            />
          )}
        />
      </div>
    </div>
  );
}
