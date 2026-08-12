"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, UserPlus } from "lucide-react";
import { PageHeader, EmptyState, Skeleton } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
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
        description="Find mentors by expertise and industry. Request a connection from real directory profiles."
      />
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52" />
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
            <Card key={m.id} className="flex h-full flex-col overflow-hidden p-0">
              <div className="flex items-start gap-3 border-b border-border px-4 py-4">
                <Avatar name={m.user.name} className="h-11 w-11" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{m.user.name || "Mentor"}</CardTitle>
                    {m.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                  </div>
                  <CardDescription className="mt-0.5 line-clamp-2">
                    {m.user.profile?.headline || m.expertise || "Career mentor"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-1 flex-col px-4 py-4">
                <ul className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                  {m.industry ? <li>Industry · {m.industry}</li> : null}
                  {m.experienceYears != null ? <li>Experience · {m.experienceYears} years</li> : null}
                  {m.mentoringTopics ? <li>Topics · {m.mentoringTopics}</li> : null}
                  {m.availability ? <li>Availability · {m.availability}</li> : null}
                  {m.preferredAudience ? <li>Audience · {m.preferredAudience}</li> : null}
                </ul>
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link href="/network">
                    <Button size="sm" className="gap-1.5">
                      <UserPlus className="h-3.5 w-3.5" />
                      Connect
                    </Button>
                  </Link>
                  <Link href="/copilot">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Ask Copilot
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
