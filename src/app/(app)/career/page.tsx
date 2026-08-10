"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/states";

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

export default function CareerIntelligencePage() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load(generate = false) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/career/analyze", { method: generate ? "POST" : "GET" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Unable to load analysis");
      return;
    }
    if (data.analysis) setAnalysis(data.analysis);
    else if (data.profile?.careerAnalysisJson) setAnalysis(JSON.parse(data.profile.careerAnalysisJson));
  }

  useEffect(() => {
    void load(false);
  }, []);

  return (
    <div>
      <PageHeader
        title="AI Career Intelligence"
        description="Explainable estimates for career fit, gaps, and next actions. Not an objective score of your worth."
        actions={
          <Button onClick={() => void load(true)} disabled={busy}>
            {busy ? "Analyzing your career profile…" : "Regenerate analysis"}
          </Button>
        }
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      {analysis ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Career Score {analysis.careerScore}</CardTitle>
                <Badge tone="accent">AI-generated estimate</Badge>
              </div>
              <CardDescription>{analysis.disclaimer}</CardDescription>
            </CardHeader>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(analysis.breakdown || {}).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-muted px-3 py-2 text-sm">
                  <p className="capitalize text-muted-foreground">{k.replace(/([A-Z])/g, " $1")}</p>
                  <p className="font-semibold">{v}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4">
            {analysis.suitablePaths?.map((path) => (
              <Card key={path.title}>
                <CardHeader>
                  <CardTitle>
                    {path.title} — {path.score}%
                  </CardTitle>
                </CardHeader>
                <div className="grid gap-3 text-sm md:grid-cols-4">
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
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">
          {busy ? "Analyzing your career profile…" : "No analysis loaded yet. Generate one to get started."}
        </Card>
      )}
    </div>
  );
}
