"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, Skeleton } from "@/components/ui/states";
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

type ResumeMeta = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl?: string | null;
  storagePath?: string | null;
  extractedText?: string | null;
  uploadedAt: string;
  analyses?: Array<{
    id: string;
    targetRole?: string | null;
    score: number;
    resultJson: string;
    createdAt: string;
  }>;
};

function isPdf(mime: string, name: string) {
  return mime.includes("pdf") || name.toLowerCase().endsWith(".pdf");
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState("");
  const [resumes, setResumes] = useState<ResumeMeta[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (!res.ok) return;
      const list: ResumeMeta[] = data.resumes || [];
      setResumes(list);
      const latest = list[0];
      if (latest) {
        setFileName(latest.fileName);
        setPreviewUrl(latest.storageUrl || null);
        const last = latest.analyses?.[latest.analyses.length - 1];
        if (last?.resultJson) {
          try {
            setAnalysis(JSON.parse(last.resultJson) as ResumeAnalysis);
          } catch {
            // ignore
          }
        }
        // Refresh signed URL when we only have a path
        if (!latest.storageUrl && latest.storagePath) {
          const signed = await fetch(`/api/resume/file?id=${encodeURIComponent(latest.id)}`);
          const signedData = await signed.json();
          if (signed.ok && signedData.url) setPreviewUrl(signedData.url);
        }
      }
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

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
      await loadResumes();
    } catch {
      setError("Unable to analyze resume");
    } finally {
      setBusy(false);
    }
  }

  const latest = resumes[0];
  const pdf = latest ? isPdf(latest.mimeType, latest.fileName) : false;

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Resume Intelligence"
        description="Preview your uploaded resume and get structure, keyword, and role-alignment feedback."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload & analyze</CardTitle>
            <CardDescription>PDF or DOCX. Optional target role improves alignment notes.</CardDescription>
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
                placeholder="e.g. Software Engineer"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? "Analyzing resume…" : "Analyze resume"}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Your resume</CardTitle>
                <CardDescription>
                  {loadingMeta
                    ? "Loading…"
                    : latest
                      ? `${latest.fileName} · uploaded ${new Date(latest.uploadedAt).toLocaleDateString()}`
                      : "No resume on file yet"}
                </CardDescription>
              </div>
              {previewUrl ? (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Download / open
                </a>
              ) : null}
            </div>
          </CardHeader>

          {loadingMeta ? (
            <Skeleton className="h-72 w-full" />
          ) : latest && pdf && previewUrl && !previewUrl.startsWith("gs://") ? (
            <iframe
              title="Resume preview"
              src={previewUrl}
              className="h-[28rem] w-full rounded-xl border border-border bg-muted"
            />
          ) : latest ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {pdf
                  ? "PDF preview unavailable (missing Storage URL). Use download if a link appears, or re-upload."
                  : "DOCX preview shows extracted text below. Use download when Storage URL is available."}
              </p>
              <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
                {latest.extractedText?.trim() || "No extracted text stored for this file."}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Upload a resume to see a preview and analysis.</p>
          )}
        </Card>
      </div>

      {busy ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
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
                  ? analysis.keywords.map((s) => (
                      <Badge key={s} tone="success">
                        {s}
                      </Badge>
                    ))
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
