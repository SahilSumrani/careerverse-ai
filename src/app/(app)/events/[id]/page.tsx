import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RegisterButton } from "@/components/events/register-button";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export const metadata = {
  title: "Event",
  description: "CareerVerse event details and RSVP.",
};

async function loadEvent(id: string) {
  if (!hasFirebaseAdminCredentials()) return null;
  try {
    const doc = await getAdminDb().collection("events").doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data() || {};
    if (data.isDemo) return null;
    return {
      id: doc.id,
      title: String(data.title || "Event"),
      organizationName: (data.organizationName as string) || null,
      location: (data.location as string) || "TBA",
      startsAt: String(data.startsAt || new Date().toISOString()),
      type: (data.type as string) || "Meetup",
      blurb: (data.blurb as string) || "",
      isDemo: false,
    };
  } catch {
    return null;
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await loadEvent(id);
  if (!event) notFound();

  const when = new Date(event.startsAt);
  const upcoming = when.getTime() >= Date.now() - 1000 * 60 * 60 * 3;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/events/browse" className="text-sm text-muted-foreground hover:text-foreground">
        ← Events
      </Link>
      <Card className="mt-4 overflow-hidden p-0">
        <div className="hero-soft border-b border-border px-5 py-6 md:px-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{event.type}</Badge>
            {event.isDemo ? <Badge tone="warning">Demo</Badge> : null}
          </div>
          <h1 className="mt-3 font-display text-3xl tracking-tight">{event.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {event.organizationName || "CareerVerse"} · {event.location}
          </p>
        </div>
        <div className="space-y-4 px-5 py-5 md:px-6">
          <p className="text-sm text-muted-foreground">{event.blurb}</p>
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-primary" />
            {when.toLocaleString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            {event.location}
          </p>
          {upcoming ? (
            <RegisterButton eventId={event.id} />
          ) : (
            <p className="text-sm text-muted-foreground">This event has ended.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
