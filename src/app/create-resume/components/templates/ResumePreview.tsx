"use client";

import { memo, RefObject } from "react";
import { Control, useWatch } from "react-hook-form";
import { ResumeData } from "../../types/resume";
import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { ClassicTemplate } from "./ClassicTemplate";

interface ResumePreviewProps {
  control: Control<ResumeData>;
  templateId: "executive" | "classic";
  zoom: number;
  fontSize: "compact" | "standard" | "large";
  previewRef: RefObject<HTMLDivElement | null>;
}

export const ResumePreview = memo(function ResumePreview({
  control,
  templateId,
  zoom,
  fontSize,
  previewRef,
}: ResumePreviewProps) {
  // Selectively watch entire resume data specifically for the preview component
  // This isolates preview re-renders away from the parent form fields
  const formData = useWatch({ control }) as ResumeData;

  const fontPadding = {
    compact: "p-[8mm]",
    standard: "p-[10mm]",
    large: "p-[11mm]",
  }[fontSize];

  return (
    <div
      style={{ width: `${210 * (zoom / 100)}mm` }}
      className="transition-all duration-150 shrink-0 mx-auto"
    >
      <div
        ref={previewRef}
        id="resume-print-area"
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top left",
        }}
        className={`w-[210mm] min-h-[297mm] max-h-[297mm] bg-white shadow-2xl rounded-sm text-slate-900 font-sans shrink-0 print:shadow-none print:w-full print:transform-none print:max-h-none overflow-hidden ${fontPadding}`}
      >
        {templateId === "executive" ? (
          <ExecutiveTemplate data={formData || {}} />
        ) : (
          <ClassicTemplate data={formData || {}} />
        )}
      </div>
    </div>
  );
});
