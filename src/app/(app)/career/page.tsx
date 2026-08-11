"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Skeleton } from "@/components/ui/states";
import { ChevronDown, ChevronUp, Route, Sparkles } from "lucide-react";

type Analysis = {
  disclaimer: string;
  careerScore: number;
  breakdown: Record<string, number>;
  strengths: string[];
  suitablePaths: Array<{
    title: string;
    score: number;
    why: string[];
    alreadyHave: string[];
    missing: string[];
    nextActions: string[];
  }>;
  skillGaps: string[];
  recommendedActions: string[];
};

function CareerIntelligenceInner() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savedGaps, setSavedGaps] = useState<string[]>([]);

  async function load(generate = false) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/career/analyze", { method: generate ? "POST" : "GET" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load analysis");
        return;
      }
      const next: Analysis | null =
        data.analysis ||
        (data.profile?.careerAnalysisJson ? JSON.parse(data.profile.careerAnalysisJson) : null);
      setAnalysis(next);
      if (next?.suitablePaths?.[0]?.title) {
        setExpanded({ [next.suitablePaths[0].title]: true });
      }
    } catch {
      setError("Unable to load analysis");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void load(false);
    try {
      const raw = localStorage.getItem("cv-roadmap-gaps");
      if (raw) setSavedGaps(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  const gapQuery = useMemo(() => {
    const gaps = analysis?.skillGaps?.slice(0, 4) || [];
    return gaps.length
      ? `What are my skill gaps? Focus on: ${gaps.join(", ")}`
      : "What are my skill gaps based on my profile?";
  }, [analysis]);

  function addGapToRoadmap(gap: string) {
    setSavedGaps((prev) => {
      const next = Array.from(new Set([...prev, gap])).slice(0, 20);
      try {
        localStorage.setItem("cv-roadmap-gaps", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-hidden">
      <PageHeader
        title="AI Career Intelligence"
        description="Explainable estimates for career fit, gaps, and next actions. Not an objective score of your worth."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/copilot?q=${encodeURIComponent(gapQuery)}`}>
              <Button variant="outline" size="sm">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Ask Copilot about gaps
              </Button>
            </Link>
            <Button onClick={() => void load(true)} disabled={busy}>
              {busy ? "Analyzing…" : "Regenerate feedback"}
            </Button>
          </div>
        }
      />

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {busy && !analysis ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      ) : null}

      {analysis ? (
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Career Score {analysis.careerScore}</CardTitle>
                <Badge tone="accent">AI-generated estimate</Badge>
              </div>
              <CardDescription>{analysis.disclaimer}</CardDescription>
            </CardHeader>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {Object.entries(analysis.breakdown || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted px-3 py-2 text-sm">
                  <p className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </Card>

          {(analysis.skillGaps?.length || analysis.recommendedActions?.length) && (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Skill gaps</CardTitle>
                  <CardDescription>Add a gap to your roadmap or ask Copilot how to close it.</CardDescription>
                </CardHeader>
                <div className="flex flex-wrap gap-2">
                  {(analysis.skillGaps || []).map((gap) => (
                    <div key={gap} className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1">
                      <Badge tone="default">{gap}</Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => addGapToRoadmap(gap)}
                      >
                        + Roadmap
                      </Button>
                      <Link
                        href={`/copilot?q=${encodeURIComponent(`How do I close my skill gap in ${gap}?`)}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Copilot
                      </Link>
                    </div>
                  ))}
                </div>
                {savedGaps.length ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Saved for roadmap: {savedGaps.join(", ")}{" "}
                    <Link href="/roadmap" className="text-primary hover:underline">
                      Open Roadmaps
                    </Link>
                  </p>
                ) : null}
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recommended actions</CardTitle>
                </CardHeader>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {(analysis.recommendedActions || []).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {analysis.suitablePaths?.map((path) => {
              const open = expanded[path.title] ?? false;
              return (
                <Card key={path.title} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setExpanded((p) => ({ ...p, [path.title]: !open }))}
                    aria-expanded={open}
                  >
                    <CardHeader className="mb-0 flex-1">
                      <CardTitle className="text-lg">
                        {path.title}{" "}
                        <span className="text-muted-foreground">· {path.score}%</span>
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {(path.why || []).slice(0, 2).join(" · ") || "Expand for fit details"}
                      </CardDescription>
                    </CardHeader>
                    {open ? <ChevronUp className="mt-4 h-4 w-4 shrink-0" /> : <ChevronDown className="mt-4 h-4 w-4 shrink-0" />}
                  </button>

                  {open ? (
                    <div className="mt-3 space-y-4 border-t border-border pt-4">
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <p className="font-medium">Why this matches</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {path.why.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">What you already have</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {path.alreadyHave.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">What is missing</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {path.missing.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium">What to do next</p>
                          <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                            {path.nextActions.map((x) => (
                              <li key={x}>{x}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/roadmap?career=${encodeURIComponent(path.title)}`}>
                          <Button size="sm" variant="outline">
                            <Route className="mr-1.5 h-3.5 w-3.5" />
                            Build roadmap
                          </Button>
                        </Link>
                        <Link
                          href={`/copilot?q=${encodeURIComponent(
                            `Help me prepare for a ${path.title} path. Gaps: ${(path.missing || []).slice(0, 4).join(", ")}`,
                          )}`}
                        >
                          <Button size="sm">
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                            Open Copilot
                          </Button>
                        </Link>
                        {(path.missing || []).slice(0, 2).map((gap) => (
                          <Button key={gap} size="sm" variant="ghost" onClick={() => addGapToRoadmap(gap)}>
                            + {gap}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </div>
      ) : !busy ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No analysis yet.{" "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => void load(true)}>
            Generate one
          </button>{" "}
          to get started.
        </Card>
      ) : null}
    </div>
  );
}

export default function CareerIntelligencePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      }
    >
      <CareerIntelligenceInner />
    </Suspense>
  );
}
