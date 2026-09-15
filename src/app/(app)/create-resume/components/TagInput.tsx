"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder: string;
  badgeColor?: string;
}

export function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  badgeColor = "bg-blue-50 text-blue-800 border-blue-200",
}: TagInputProps) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 tracking-wide">
          {label}
        </label>
        <span className="text-[11px] text-slate-400 font-medium">
          {tags.length} added
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg min-h-[42px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:bg-white transition-all">
        {tags.map((tag, idx) => (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${badgeColor} shadow-2xs`}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(idx)}
              aria-label={`Remove ${tag}`}
              className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-black/5"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <div className="flex-1 min-w-[140px] flex items-center gap-1">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length === 0 ? placeholder : "Add more (press Enter)..."}
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden py-1 px-1"
          />
          {inputVal.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputVal)}
              aria-label="Add tag"
              className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
