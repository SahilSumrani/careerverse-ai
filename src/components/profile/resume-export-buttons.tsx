"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  downloadResumeDocx,
  downloadResumePdf,
  type ResumeExportProfile,
} from "@/lib/resume-export";

export function ResumeExportButtons({ profile }: { profile: ResumeExportProfile }) {
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null);
  const [error, setError] = useState("");

  async function onPdf() {
    setBusy("pdf");
    setError("");
    try {
      downloadResumePdf(profile);
    } catch {
      setError("Unable to generate PDF");
    } finally {
      setBusy(null);
    }
  }

  async function onDocx() {
    setBusy("docx");
    setError("");
    try {
      await downloadResumeDocx(profile);
    } catch {
      setError("Unable to generate DOCX");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => void onPdf()}>
          {busy === "pdf" ? "Generating…" : "Download PDF"}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={() => void onDocx()}>
          {busy === "docx" ? "Generating…" : "Download DOCX"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
