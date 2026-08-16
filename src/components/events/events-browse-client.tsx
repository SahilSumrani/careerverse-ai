"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegisterButton } from "@/components/events/register-button";
import { cn } from "@/lib/utils";

export type EventItem = {
  id: string;
  title: string;
  organizationName?: string | null;
  location: string;
  startsAt: string;
  type: string;
  blurb: string;
  isDemo?: boolean;
};

const TYPES = ["All", "Panel", "Workshop", "Meetup"] as const;

function isUpcoming(iso: string) {
  return new Date(iso).getTime() >= Date.now() - 1000 * 60 * 60 * 3;
}

export function EventsBrowseClient({ items }: { items: EventItem[] }) {
  const [type, setType] = useState<(typeof TYPES)[number]>("All");
  const [upcomingOnly, setUpcomingOnly] = useState(true);

  const filtered = useMemo(() => {
    return items
      .filter((e) => (type === "All" ? true : e.type === type))
      .filter((e) => (upcomingOnly ? isUpcoming(e.startsAt) : true))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [items, type, upcomingOnly]);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Browse events"
        description="Workshops, panels, and campus meetups — built for CareerVerse job-seekers."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                type === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setUpcomingOnly((v) => !v)}
          className={cn(
            "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold",
            upcomingOnly ? "border-primary/40 bg-accent text-primary" : "border-border bg-card",
          )}
        >
          {upcomingOnly ? "Upcoming only" : "Show all dates"}
        </button>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((e) => {
            const when = new Date(e.startsAt);
            const upcoming = isUpcoming(e.startsAt);
            return (
              <Card key={e.id} className="flex h-full flex-col overflow-hidden p-0">
                <div className="hero-soft border-b border-border px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="info">{e.type}</Badge>
                    {e.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                    {!upcoming ? <Badge tone="default">Past</Badge> : null}
                  </div>
                  <Link
                    href={`/events/${e.id}`}
                    className="mt-2 block font-display text-xl tracking-tight hover:text-primary"
                  >
                    {e.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {e.organizationName || "CareerVerse"} · {e.location}
                  </p>
                </div>
                <div className="flex flex-1 flex-col px-5 py-4">
                  <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{e.blurb}</p>
                  <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2 font-medium text-foreground">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" />
                      <span suppressHydrationWarning>
                        {when.toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {e.location}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {upcoming ? (
                      <RegisterButton eventId={e.id} />
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Event ended
                      </Button>
                    )}
                    <Link
                      href={`/events/${e.id}`}
                      className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No events match these filters"
          description="Try another type, or show all dates. Events load from Firestore only."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setType("All");
                setUpcomingOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        CareerVerse events stay in your signed-in workspace — RSVP intent saves via the Events API.
      </p>
    </div>
  );
}
