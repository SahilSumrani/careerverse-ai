"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type ResumeAnalysis = {
  disclaimer: string;
  score: number;
  structure: string;
  skills: string[];
  keywords: string[];
  achievements: string[];
  clarity: string;
  atsNotes: string;
  roleAlignment: string;
  recommendations: string[];
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a PDF or DOCX resume file.");
      return;
    }
    setBusy(true);
    setError("");
    setAnalysis(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (targetRole.trim()) form.append("targetRole", targetRole.trim());
      const res = await fetch("/api/resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to analyze resume");
        return;
      }
      setFileName(data.resume?.fileName || file.name);
      setAnalysis(data.analysis);
    } catch {
      setError("Unable to analyze resume");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Resume Intelligence"
        description="Upload a PDF or DOCX for structure, keyword, and role-alignment feedback. Scores are AI-generated estimates."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Upload resume</CardTitle>
          <CardDescription>Accepted formats: PDF, DOCX. Optional target role improves alignment notes.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Resume file</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-role">Target role (optional)</Label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Product Manager"
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Analyzing resume…" : "Analyze resume"}
          </Button>
        </form>
      </Card>

      {busy ? (
        <Card className="mt-4 p-6 text-sm text-muted-foreground">Analyzing resume…</Card>
      ) : null}

      {analysis ? (
        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>
                  Score {analysis.score}
                  {fileName ? ` · ${fileName}` : ""}
                </CardTitle>
                <Badge tone="accent">AI-generated estimate</Badge>
              </div>
              <CardDescription>{analysis.disclaimer}</CardDescription>
            </CardHeader>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Structure</p>
                <p className="mt-1">{analysis.structure}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Clarity</p>
                <p className="mt-1">{analysis.clarity}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Role alignment</p>
                <p className="mt-1">{analysis.roleAlignment}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">ATS notes</p>
                <p className="mt-1">{analysis.atsNotes}</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Detected skills</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {analysis.skills?.length
                  ? analysis.skills.map((s) => <Badge key={s}>{s}</Badge>)
                  : <p className="text-sm text-muted-foreground">None detected</p>}
              </div>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
              </CardHeader>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords?.length
                  ? analysis.keywords.map((s) => <Badge key={s} tone="success">{s}</Badge>)
                  : <p className="text-sm text-muted-foreground">None flagged</p>}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {(analysis.recommendations || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
