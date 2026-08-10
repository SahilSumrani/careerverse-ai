import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Browse events",
  description: "Career events, workshops, and meetups on CareerVerse.",
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { status: { in: ["PUBLISHED", "LIVE", "COMPLETED"] } },
    include: {
      speakers: { include: { speaker: { include: { user: true } } } },
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
    take: 50,
  });

  return (
    <div>
      <PageHeader
        title="Browse events"
        description="Workshops, career panels, and community meetups. Demo events are clearly marked."
      />

      <div className="grid gap-3">
        {events.map((event) => (
          <Card key={event.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/events/${event.id}`} className="text-base font-semibold hover:text-primary">
                  {event.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleString()} · {event.mode} · {event.type}
                  {event.location ? ` · ${event.location}` : ""}
                  {event.isDemo ? " · Demo data" : ""}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone={event.status === "LIVE" ? "success" : event.status === "COMPLETED" ? "default" : "accent"}>
                  {event.status}
                </Badge>
                <p className="text-xs text-muted-foreground">{event._count.registrations} registered</p>
              </div>
            </div>
          </Card>
        ))}
        {!events.length ? (
          <EmptyState title="No events published yet" description="Check back soon for upcoming sessions." />
        ) : null}
      </div>
    </div>
  );
}
