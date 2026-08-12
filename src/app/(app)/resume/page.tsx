"use client";

import { useCallback, useEffect, useState } from "react";
import { FileUp, RotateCcw } from "lucide-react";
import { PageHeader, Skeleton } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createSoftCache } from "@/lib/client-cache";
import { cn } from "@/lib/utils";
import "@/styles/cv-product.css";

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

function looksLikeLocalPath(path: string | null | undefined) {
  if (!path) return false;
  const p = path.replace(/\\/g, "/");
  if (p.startsWith("resumes/")) return false;
  return p.startsWith("/") || /^[A-Za-z]:\//.test(p) || p.includes("/tmp/");
}

function looksBrokenStorageUrl(url: string | null | undefined) {
  if (!url) return false;
  const u = url.replace(/\\/g, "/");
  return u.includes("/tmp/") || u.includes("/careerverse-uploads/");
}

type ResumeCache = {
  resumes: ResumeMeta[];
  analysis: ResumeAnalysis | null;
  fileName: string;
  previewUrl: string | null;
  fileUnavailable: string | null;
};
const resumeCache = createSoftCache<ResumeCache>();

export default function ResumePage() {
  const cached = resumeCache.peek();
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(!cached);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(cached?.analysis ?? null);
  const [fileName, setFileName] = useState(cached?.fileName ?? "");
  const [resumes, setResumes] = useState<ResumeMeta[]>(cached?.resumes ?? []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(cached?.previewUrl ?? null);
  const [fileUnavailable, setFileUnavailable] = useState<string | null>(cached?.fileUnavailable ?? null);

  const loadResumes = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? resumeCache.has();
    if (!soft) setLoadingMeta(true);
    setFileUnavailable(null);
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (!res.ok) return;
      const list: ResumeMeta[] = data.resumes || [];
      setResumes(list);
      let nextAnalysis: ResumeAnalysis | null = null;
      let nextFileName = "";
      let nextPreview: string | null = null;
      let nextUnavailable: string | null = null;
      const latest = list[0];
      if (latest) {
        nextFileName = latest.fileName;
        setFileName(latest.fileName);
        const last = latest.analyses?.[latest.analyses.length - 1];
        if (last?.resultJson) {
          try {
            nextAnalysis = JSON.parse(last.resultJson) as ResumeAnalysis;
            setAnalysis(nextAnalysis);
          } catch {
            // ignore
          }
        }

        if (looksBrokenStorageUrl(latest.storageUrl) || looksLikeLocalPath(latest.storagePath)) {
          nextPreview = null;
          setPreviewUrl(null);
        } else if (latest.storageUrl?.startsWith("http")) {
          nextPreview = latest.storageUrl;
          setPreviewUrl(latest.storageUrl);
        } else {
          setPreviewUrl(null);
        }

        const signed = await fetch(`/api/resume/file?id=${encodeURIComponent(latest.id)}`);
        const signedData = await signed.json();
        if (signed.ok) {
          if (signedData.unavailable) {
            nextPreview = null;
            nextUnavailable =
              signedData.reason ||
              "This resume file is no longer available. Please re-upload a PDF or DOCX.";
            setPreviewUrl(null);
            setFileUnavailable(nextUnavailable);
          } else if (signedData.url) {
            nextPreview = signedData.url;
            setPreviewUrl(signedData.url);
            setFileUnavailable(null);
          }
        }
      } else {
        setPreviewUrl(null);
      }
      resumeCache.set({
        resumes: list,
        analysis: nextAnalysis,
        fileName: nextFileName,
        previewUrl: nextPreview,
        fileUnavailable: nextUnavailable,
      });
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes({ soft: resumeCache.has() });
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
    setFileUnavailable(null);
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
  const canPreviewPdf =
    Boolean(latest && pdf && previewUrl && !previewUrl.startsWith("gs://") && !fileUnavailable);
  const score = Math.min(100, Math.max(0, analysis?.score ?? 0));

  function scrollToUpload() {
    document.getElementById("resume-file")?.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("resume-file")?.focus();
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Resume Intelligence"
        description="Upload once, preview clearly, and read structure, keyword, and role-alignment feedback."
      />

      <div className="cv-shell">
        <div className="cv-shell-inner grid gap-4 p-4 md:p-5 lg:grid-cols-5">
          <section className="cv-panel space-y-4 p-5 lg:col-span-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Upload</p>
              <h2 className="mt-1 font-display text-xl tracking-tight">Analyze resume</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                PDF or DOCX. Optional target role sharpens alignment notes.
              </p>
            </div>
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
                {file ? (
                  <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
                ) : latest ? (
                  <p className="text-xs text-muted-foreground">Re-upload replaces the file on record.</p>
                ) : null}
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
              <Button type="submit" disabled={busy} className="w-full sm:w-auto">
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
                {busy ? "Analyzing…" : latest ? "Re-upload & analyze" : "Analyze resume"}
              </Button>
            </form>
          </section>

          <section className="cv-panel flex flex-col p-5 lg:col-span-3" style={{ animationDelay: "80ms" }}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Preview</p>
                <h2 className="mt-1 font-display text-xl tracking-tight">Your resume</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {loadingMeta
                    ? "Loading…"
                    : latest
                      ? `${latest.fileName} · uploaded ${new Date(latest.uploadedAt).toLocaleDateString()}`
                      : "No resume on file yet"}
                </p>
              </div>
              {previewUrl && !fileUnavailable ? (
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

            {loadingMeta && !resumes.length && !analysis ? (
              <Skeleton className="h-72 w-full" />
            ) : fileUnavailable ? (
              <div className="flex flex-1 flex-col justify-center gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/90 p-5">
                <p className="text-sm font-semibold text-amber-950">Resume file unavailable</p>
                <p className="text-sm text-amber-900/80">{fileUnavailable}</p>
                <Button type="button" variant="secondary" onClick={scrollToUpload} className="w-fit">
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Re-upload resume
                </Button>
                {latest?.extractedText?.trim() ? (
                  <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-white/80 p-3 text-xs leading-relaxed text-muted-foreground">
                    {latest.extractedText}
                  </div>
                ) : null}
              </div>
            ) : canPreviewPdf ? (
              <iframe
                title="Resume preview"
                src={previewUrl!}
                className="h-[28rem] w-full rounded-xl border border-border bg-muted"
              />
            ) : latest ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {pdf
                    ? "PDF preview unavailable. Use download if a link appears, or re-upload."
                    : "DOCX preview shows extracted text below. Use download when a file link is available."}
                </p>
                <div className="max-h-[28rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
                  {latest.extractedText?.trim() || "No extracted text stored for this file."}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-start justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 p-8">
                <p className="text-sm font-semibold">No preview yet</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Upload a PDF or DOCX to see a preview and analysis here.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {busy ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : null}

      {analysis ? (
        <div className="cv-stagger mt-4 space-y-4">
          <section className="cv-panel p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="cv-score-ring" style={{ ["--score" as string]: score }}>
                  <span>{analysis.score}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl tracking-tight">
                      Analysis{fileName ? ` · ${fileName}` : ""}
                    </h2>
                    <Badge tone="accent">AI estimate</Badge>
                  </div>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">{analysis.disclaimer}</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {[
                { label: "Structure", body: analysis.structure },
                { label: "Clarity", body: analysis.clarity },
                { label: "Role alignment", body: analysis.roleAlignment },
                { label: "ATS notes", body: analysis.atsNotes },
              ].map((block) => (
                <div key={block.label} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {block.label}
                  </p>
                  <p className="mt-2 leading-relaxed">{block.body}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="cv-panel p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">Detected skills</h3>
              <div className="cv-chip-row mt-3">
                {analysis.skills?.length
                  ? analysis.skills.map((s) => <Badge key={s}>{s}</Badge>)
                  : <p className="text-sm text-muted-foreground">None detected</p>}
              </div>
            </section>
            <section className="cv-panel p-5">
              <h3 className="text-[15px] font-semibold tracking-tight">Keywords</h3>
              <div className="cv-chip-row mt-3">
                {analysis.keywords?.length
                  ? analysis.keywords.map((s) => (
                      <Badge key={s} tone="success">
                        {s}
                      </Badge>
                    ))
                  : <p className="text-sm text-muted-foreground">None flagged</p>}
              </div>
            </section>
          </div>

          <section className="cv-panel p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Recommendations</h3>
            <ul className="mt-3 space-y-2">
              {(analysis.recommendations || []).map((r) => (
                <li
                  key={r}
                  className={cn(
                    "rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground",
                  )}
                >
                  {r}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}
