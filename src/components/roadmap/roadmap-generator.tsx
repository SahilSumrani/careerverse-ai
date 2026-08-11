"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/avatar";
import { CAREER_ROADMAP_ROLES, type CareerRoadmapRole } from "@/data/career-roadmaps";
import { cn } from "@/lib/utils";
import { createSoftCache } from "@/lib/client-cache";

type ProgressMap = Record<string, boolean>;

const progressCache = createSoftCache<Record<string, ProgressMap>>(Infinity);

function storageKey(roleId: string) {
  return `cv-roadmap-progress:${roleId}`;
}

function loadProgress(roleId: string): ProgressMap {
  const cached = progressCache.peek()?.[roleId];
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(storageKey(roleId));
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function saveProgress(roleId: string, map: ProgressMap) {
  try {
    localStorage.setItem(storageKey(roleId), JSON.stringify(map));
  } catch {
    // ignore
  }
  const all = progressCache.peek() || {};
  progressCache.set({ ...all, [roleId]: map });
}

export function RoadmapGenerator({
  careers,
  initialTitle,
}: {
  careers?: Array<{ id: string; title: string; isDemo?: boolean }>;
  initialTitle?: string;
}) {
  const roles = CAREER_ROADMAP_ROLES;
  const categories = useMemo(
    () => Array.from(new Set(roles.map((r) => r.category))),
    [roles],
  );

  const initial =
    (initialTitle && roles.find((r) => r.title.toLowerCase() === initialTitle.toLowerCase())) ||
    roles.find((r) => r.id === "frontend") ||
    roles[0];

  const [category, setCategory] = useState(initial.category);
  const [roleId, setRoleId] = useState(initial.id);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [openStage, setOpenStage] = useState<string | null>(initial.stages[0]?.id ?? null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiStages, setAiStages] = useState<Array<{ key: string; title: string; items: string[] }> | null>(
    null,
  );

  const role: CareerRoadmapRole =
    roles.find((r) => r.id === roleId) || roles.find((r) => r.category === category) || roles[0];

  const filtered = roles.filter((r) => (category ? r.category === category : true));

  useEffect(() => {
    setProgress(loadProgress(role.id));
    setOpenStage(role.stages[0]?.id ?? null);
    setAiStages(null);
    setAiError("");
  }, [role.id]);

  const allMilestoneIds = role.stages.flatMap((s) => s.milestones.map((m) => m.id));
  const doneCount = allMilestoneIds.filter((id) => progress[id]).length;
  const pct = allMilestoneIds.length ? Math.round((doneCount / allMilestoneIds.length) * 100) : 0;

  function toggle(id: string) {
    setProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveProgress(role.id, next);
      return next;
    });
  }

  async function generateAi() {
    setAiBusy(true);
    setAiError("");
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerTitle: role.title,
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
        setAiError(data.error || "Unable to generate personalized roadmap");
        return;
      }
      setAiStages(data.result?.stages || null);
    } catch {
      setAiError("Unable to generate personalized roadmap");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="hero-soft border-b border-border px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Interactive career roadmap</p>
              <h2 className="mt-1 font-display text-2xl tracking-tight md:text-3xl">{role.title}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{role.blurb}</p>
            </div>
            <Badge tone="accent">{pct}% complete</Badge>
          </div>
          <Progress value={pct} className="mt-4 h-2.5" />
          <p className="mt-2 text-xs text-muted-foreground">
            {doneCount} of {allMilestoneIds.length} milestones checked · progress saves on this device
          </p>
        </div>

        <div className="space-y-4 p-5 md:p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCategory(c);
                    const next = roles.find((r) => r.category === c);
                    if (next) setRoleId(next.id);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                    category === c
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/40",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Role ({filtered.length}
              {careers?.length ? "" : ""})
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRoleId(r.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left transition",
                    roleId === r.id
                      ? "border-primary bg-accent/50 shadow-sm"
                      : "border-border bg-card hover:border-primary/35",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{r.title}</span>
                    {r.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{r.blurb}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {role.stages.map((stage, index) => {
          const open = openStage === stage.id;
          const stageDone = stage.milestones.filter((m) => progress[m.id]).length;
          return (
            <Card key={stage.id} className="overflow-hidden p-0">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left md:px-5"
                onClick={() => setOpenStage(open ? null : stage.id)}
                aria-expanded={open}
              >
                <div>
                  <p className="text-xs font-semibold text-primary">
                    Stage {index + 1}
                    {stage.weeks ? ` · ${stage.weeks}` : ""}
                  </p>
                  <p className="mt-0.5 text-base font-semibold">{stage.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {stage.skills.map((s) => (
                      <Badge key={s} tone="default">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {stageDone}/{stage.milestones.length}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")} />
                </div>
              </button>
              {open ? (
                <div className="space-y-2 border-t border-border px-4 py-4 md:px-5">
                  {stage.milestones.map((m) => {
                    const checked = !!progress[m.id];
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggle(m.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                          checked ? "border-primary/40 bg-accent/40" : "border-border bg-card hover:border-primary/30",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                          )}
                        >
                          {checked ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold">{m.title}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{m.detail}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Personalized AI overlay
          </CardTitle>
          <CardDescription>
            Optional: generate stages from your CareerVerse profile context. Structured roadmap above stays interactive
            either way.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void generateAi()} disabled={aiBusy}>
            {aiBusy ? "Generating…" : "Generate AI roadmap"}
          </Button>
        </div>
        {aiError ? <p className="mt-3 text-sm text-destructive">{aiError}</p> : null}
        {aiStages ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {aiStages.map((stage, index) => (
              <Card key={stage.key} className="shadow-none">
                <CardHeader>
                  <CardTitle className="text-base">
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
        ) : null}
      </Card>
    </div>
  );
}
