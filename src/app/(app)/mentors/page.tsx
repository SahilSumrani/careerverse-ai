"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSoftCache } from "@/lib/client-cache";

type Mentor = {
  id: string;
  expertise?: string | null;
  industry?: string | null;
  experienceYears?: number | null;
  mentoringTopics?: string | null;
  availability?: string | null;
  preferredAudience?: string | null;
  isDemo?: boolean;
  user: {
    id: string;
    name?: string | null;
    profile?: { headline?: string | null } | null;
  };
};

const mentorsCache = createSoftCache<Mentor[]>();

export default function MentorsPage() {
  const cached = mentorsCache.peek();
  const [mentors, setMentors] = useState<Mentor[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    const soft = opts?.soft ?? mentorsCache.has();
    if (!soft) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/mentors");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to load mentors");
        return;
      }
      const next = (data.mentors || []) as Mentor[];
      setMentors(next);
      mentorsCache.set(next);
    } catch {
      setError("Unable to load mentors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ soft: mentorsCache.has() });
  }, [load]);

  return (
    <div>
      <PageHeader
        title="Mentors"
        description="Find mentors by expertise and industry. Connect through your network — demo profiles are marked."
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : !mentors.length ? (
        <EmptyState
          title="No mentors listed yet"
          description="Mentor profiles will appear here when available."
          action={
            <Link href="/network" className="text-sm text-primary">
              Browse network
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mentors.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>{m.user.name || "Mentor"}</CardTitle>
                  {m.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                </div>
                <CardDescription>
                  {m.user.profile?.headline || m.expertise || "Career mentor"}
                </CardDescription>
              </CardHeader>
              <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
                {m.industry ? <li>Industry: {m.industry}</li> : null}
                {m.experienceYears != null ? <li>Experience: {m.experienceYears} years</li> : null}
                {m.mentoringTopics ? <li>Topics: {m.mentoringTopics}</li> : null}
                {m.availability ? <li>Availability: {m.availability}</li> : null}
                {m.preferredAudience ? <li>Audience: {m.preferredAudience}</li> : null}
              </ul>
              <Link href="/network">
                <Button size="sm">Connect</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
