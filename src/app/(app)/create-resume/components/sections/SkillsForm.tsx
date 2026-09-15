"use client";

import { Control, Controller } from "react-hook-form";
import { ResumeData } from "../../types/resume";
import { TagInput } from "../TagInput";

interface SkillsFormProps {
  control: Control<ResumeData>;
}

export function SkillsForm({ control }: SkillsFormProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <Controller
        control={control}
        name="skills.languages"
        render={({ field: { value, onChange } }) => (
          <TagInput
            label="Programming & Core Languages"
            tags={value || []}
            onChange={onChange}
            placeholder="e.g. JavaScript, TypeScript, Python, SQL"
            badgeColor="bg-blue-50 text-blue-800 border-blue-200"
          />
        )}
      />

      <Controller
        control={control}
        name="skills.frameworks"
        render={({ field: { value, onChange } }) => (
          <TagInput
            label="Frameworks & Libraries"
            tags={value || []}
            onChange={onChange}
            placeholder="e.g. React.js, Next.js, Node.js, Tailwind CSS"
            badgeColor="bg-indigo-50 text-indigo-800 border-indigo-200"
          />
        )}
      />

      <Controller
        control={control}
        name="skills.tools"
        render={({ field: { value, onChange } }) => (
          <TagInput
            label="Databases, Platforms & Developer Tools"
            tags={value || []}
            onChange={onChange}
            placeholder="e.g. PostgreSQL, Git, Docker, Figma, AWS"
            badgeColor="bg-emerald-50 text-emerald-800 border-emerald-200"
          />
        )}
      />
    </div>
  );
}
