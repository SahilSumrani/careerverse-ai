"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EmptyState, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import { createSoftCache } from "@/lib/client-cache";

type CareerOption = { id: string; title: string; skills?: string[] };
type AiStage = { key: string; title: string; items: string[] };
type ProgressMap = Record<string, boolean>;

const progressCache = createSoftCache<Record<string, ProgressMap>>(Infinity);

function storageKey(roleId: string) {
  return `cv-roadmap-progress:${roleId}`;
}

function itemId(stageKey: string, item: string, index: number) {
  return `${stageKey}:${index}:${item.slice(0, 40)}`;
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
  careers: careersProp,
  initialTitle,
}: {
  careers?: CareerOption[];
  initialTitle?: string;
}) {
  const [careers, setCareers] = useState<CareerOption[]>(careersProp ?? []);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(!careersProp?.length);
  const [customTitle, setCustomTitle] = useState("");
  const [roleId, setRoleId] = useState("");
  const [progress, setProgress] = useState<ProgressMap>({});
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [stages, setStages] = useState<AiStage[] | null>(null);
  const [goal, setGoal] = useState("");

  const loadCareers = useCallback(async () => {
    if (careersProp?.length) {
      setCareers(careersProp);
      setLoadingCareers(false);
      return;
    }
    setLoadingCareers(true);
    try {
      const res = await fetch("/api/roadmap");
      const data = await res.json();
      if (res.ok) {
        setCareers((data.careers || []) as CareerOption[]);
        setSuggested(Array.isArray(data.suggested) ? data.suggested.map(String) : []);
      }
    } catch {
      // empty list + honest empty state
    } finally {
      setLoadingCareers(false);
    }
  }, [careersProp]);

  useEffect(() => {
    void loadCareers();
  }, [loadCareers]);

  const role = useMemo(() => {
    if (roleId === "custom" && customTitle.trim()) {
      return { id: "custom", title: customTitle.trim(), skills: [] as string[] };
    }
    return careers.find((c) => c.id === roleId) || null;
  }, [careers, roleId, customTitle]);

  useEffect(() => {
    if (!careers.length || roleId) return;
    const fromQuery =
      initialTitle &&
      careers.find((c) => c.title.toLowerCase() === initialTitle.toLowerCase());
    if (fromQuery) {
      setRoleId(fromQuery.id);
      return;
    }
    if (initialTitle?.trim()) {
      setCustomTitle(initialTitle.trim());
      setRoleId("custom");
      return;
    }
    const fromSuggested = suggested[0]
      ? careers.find((c) => c.title.toLowerCase() === suggested[0].toLowerCase())
      : undefined;
    setRoleId(fromSuggested?.id || careers[0]?.id || "");
  }, [careers, initialTitle, roleId, suggested]);

  useEffect(() => {
    if (!role) return;
    setProgress(loadProgress(role.id));
    setStages(null);
    setGoal("");
    setAiError("");
    setOpenStage(null);
  }, [role?.id, role?.title]);

  const allItemIds = useMemo(() => {
    if (!stages) return [];
    return stages.flatMap((s) => s.items.map((item, i) => itemId(s.key, item, i)));
  }, [stages]);
  const doneCount = allItemIds.filter((id) => progress[id]).length;
  const pct = allItemIds.length ? Math.round((doneCount / allItemIds.length) * 100) : 0;

  function toggle(id: string) {
    if (!role) return;
    setProgress((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveProgress(role.id, next);
      return next;
    });
  }

  async function generateAi() {
    if (!role?.title) {
      setAiError("Pick or enter a career title first");
      return;
    }
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
      const nextStages = (data.result?.stages || []) as AiStage[];
      setStages(nextStages.length ? nextStages : null);
      setGoal(String(data.result?.goal || role.title));
      setOpenStage(nextStages[0]?.key ?? null);
      if (!nextStages.length) setAiError("No stages returned — try again or pick another role");
    } catch {
      setAiError("Unable to generate personalized roadmap");
    } finally {
      setAiBusy(false);
    }
  }

  if (loadingCareers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="hero-soft border-b border-border px-5 py-5 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Personalized career roadmap</p>
              <h2 className="mt-1 font-display text-2xl tracking-tight md:text-3xl">
                {goal || role?.title || "Choose a target role"}
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Stages are generated from your CareerVerse profile and AI — not canned demo paths.
              </p>
            </div>
            {stages ? <Badge tone="accent">{pct}% complete</Badge> : null}
          </div>
          {stages ? (
            <>
              <Progress value={pct} className="mt-4 h-2.5" />
              <p className="mt-2 text-xs text-muted-foreground">
                {doneCount} of {allItemIds.length} milestones checked · progress saves on this device
              </p>
            </>
          ) : null}
        </div>

        <div className="space-y-4 p-5 md:p-6">
          {suggested.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                From your career intelligence
              </p>
              <div className="flex flex-wrap gap-2">
                {suggested.map((title) => {
                  const match = careers.find((c) => c.title.toLowerCase() === title.toLowerCase());
                  return (
                    <button
                      key={title}
                      type="button"
                      onClick={() => {
                        if (match) setRoleId(match.id);
                        else {
                          setCustomTitle(title);
                          setRoleId("custom");
                        }
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                        (match ? roleId === match.id : roleId === "custom" && customTitle === title)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      {title}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Target role ({careers.length})
            </p>
            {careers.length ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {careers.map((r) => (
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
                    <span className="text-sm font-semibold">{r.title}</span>
                    {r.skills?.length ? (
                      <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                        {r.skills.slice(0, 4).join(" · ")}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No catalog roles available"
                description="Enter a custom career title below, or complete Career Intelligence for suggestions."
              />
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Or custom title
              </label>
              <Input
                value={customTitle}
                onChange={(e) => {
                  setCustomTitle(e.target.value);
                  setRoleId("custom");
                }}
                placeholder="e.g. Platform Engineer"
              />
            </div>
            <Button onClick={() => void generateAi()} disabled={aiBusy || !role?.title}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {aiBusy ? "Generating…" : stages ? "Regenerate roadmap" : "Generate AI roadmap"}
            </Button>
          </div>
          {aiError ? <p className="text-sm text-destructive">{aiError}</p> : null}
        </div>
      </Card>

      {!stages && !aiBusy ? (
        <EmptyState
          title="No roadmap yet"
          description="Pick a role and generate a personalized staged plan from your profile. Complete onboarding if generation fails."
          action={
            <Link href="/career" className="text-sm font-semibold text-primary">
              Open Career Intelligence →
            </Link>
          }
        />
      ) : null}

      {aiBusy && !stages ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : null}

      {stages ? (
        <div className="space-y-3">
          {stages.map((stage, index) => {
            const open = openStage === stage.key;
            const stageIds = stage.items.map((item, i) => itemId(stage.key, item, i));
            const stageDone = stageIds.filter((id) => progress[id]).length;
            return (
              <Card key={stage.key} className="overflow-hidden p-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left md:px-5"
                  onClick={() => setOpenStage(open ? null : stage.key)}
                  aria-expanded={open}
                >
                  <div>
                    <p className="text-xs font-semibold text-primary">Stage {index + 1}</p>
                    <p className="mt-0.5 text-base font-semibold">{stage.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {stageDone}/{stage.items.length}
                    </span>
                    <ChevronDown
                      className={cn("h-4 w-4 text-muted-foreground transition", open && "rotate-180")}
                    />
                  </div>
                </button>
                {open ? (
                  <div className="space-y-2 border-t border-border px-4 py-4 md:px-5">
                    {stage.items.map((item, i) => {
                      const id = itemId(stage.key, item, i);
                      const checked = !!progress[id];
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => toggle(id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition",
                            checked
                              ? "border-primary/40 bg-accent/40"
                              : "border-border bg-card hover:border-primary/30",
                          )}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                              checked
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            )}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span className="text-sm font-medium">{item}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : null}

      {stages ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About this plan</CardTitle>
            <CardDescription>
              Personalized with your skills, gaps, and goals. Not a guarantee of hiring outcomes — regenerate anytime.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
