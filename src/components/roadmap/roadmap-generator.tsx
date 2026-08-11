"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type CareerOption = { id: string; title: string; isDemo?: boolean };

type RoadmapResult = {
  goal: string;
  stages: Array<{ key: string; title: string; items: string[] }>;
};

export function RoadmapGenerator({
  careers,
  initialTitle,
}: {
  careers: CareerOption[];
  initialTitle?: string;
}) {
  const matched = initialTitle
    ? careers.find((c) => c.title.toLowerCase() === initialTitle.toLowerCase())?.title
    : undefined;
  const [careerTitle, setCareerTitle] = useState(matched || careers[0]?.title || "Software Developer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RoadmapResult | null>(null);

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerTitle,
          skillGaps: (() => {
            try {
              return JSON.parse(localStorage.getItem("cv-roadmap-gaps") || "[]");
            } catch {
              return [];
            }
          })(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to generate roadmap");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Unable to generate roadmap");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate personalized roadmap</CardTitle>
          <CardDescription>
            Uses your profile context when available. Demo careers are marked; stages are planning guidance, not guarantees.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Select value={careerTitle} onChange={(e) => setCareerTitle(e.target.value)} className="max-w-md flex-1">
            {careers.map((c) => (
              <option key={c.id} value={c.title}>
                {c.title}
                {c.isDemo ? " (Demo)" : ""}
              </option>
            ))}
            {!careers.length ? <option value="Software Developer">Software Developer</option> : null}
          </Select>
          <Button onClick={() => void generate()} disabled={busy || !careerTitle}>
            {busy ? "Generating…" : "Generate roadmap"}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </Card>

      {result ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl tracking-tight">{result.goal}</h2>
            <Badge tone="accent">AI roadmap</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {result.stages.map((stage, index) => (
              <Card key={stage.key}>
                <CardHeader>
                  <CardTitle>
                    {index + 1}. {stage.title}
                  </CardTitle>
                </CardHeader>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {stage.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
