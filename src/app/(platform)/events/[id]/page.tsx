import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { RegisterButton } from "@/components/events/register-button";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      speakers: { include: { speaker: { include: { user: true } } } },
      organization: true,
      registrations: {
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!event || !["PUBLISHED", "LIVE", "COMPLETED"].includes(event.status)) notFound();

  const alreadyRegistered = session?.user?.id
    ? event.registrations.some((r) => r.userId === session.user.id)
    : false;
  const canRegister = event.status === "PUBLISHED" || event.status === "LIVE";
  const peopleYouMet =
    event.status === "COMPLETED"
      ? event.registrations.filter((r) => r.userId !== session?.user?.id)
      : [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/events" className="text-sm text-muted-foreground hover:text-foreground">
        ← Events
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{event.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {new Date(event.date).toLocaleString()} · {event.mode} · {event.type}
            {event.location ? ` · ${event.location}` : ""}
            {event.organization?.name ? ` · ${event.organization.name}` : ""}
            {event.isDemo ? " · Demo event" : ""}
          </p>
        </div>
        <Badge tone={event.status === "LIVE" ? "success" : "accent"}>{event.status}</Badge>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>
            {event._count.registrations} registered
            {event.capacity ? ` · capacity ${event.capacity}` : ""}
          </CardDescription>
        </CardHeader>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</p>
        <div className="mt-4">
          {session?.user ? (
            canRegister ? (
              <RegisterButton eventId={event.id} alreadyRegistered={alreadyRegistered} />
            ) : (
              <p className="text-sm text-muted-foreground">Registration is closed for this event.</p>
            )
          ) : (
            <Link href="/auth/signin" className="text-sm text-primary">
              Sign in to register
            </Link>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Speakers</CardTitle>
        </CardHeader>
        {event.speakers.length ? (
          <ul className="space-y-3">
            {event.speakers.map((row) => (
              <li key={row.speakerId} className="rounded-xl border border-border p-3">
                <p className="font-medium">{row.speaker.user.name || "Speaker"}</p>
                <p className="text-xs text-muted-foreground">
                  {[row.role, row.speaker.title, row.speaker.organization, row.speaker.expertise]
                    .filter(Boolean)
                    .join(" · ")}
                  {row.speaker.isDemo ? " · Demo" : ""}
                </p>
                {row.speaker.bio ? <p className="mt-2 text-sm text-muted-foreground">{row.speaker.bio}</p> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Speakers will be announced soon.</p>
        )}
      </Card>

      {event.status === "COMPLETED" ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>People You Met</CardTitle>
            <CardDescription>Fellow attendees from this completed event.</CardDescription>
          </CardHeader>
          {peopleYouMet.length ? (
            <ul className="space-y-2">
              {peopleYouMet.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{r.user.name || "Attendee"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.user.profile?.headline || "CareerVerse member"}
                      {r.user.isDemo ? " · Demo" : ""}
                    </p>
                  </div>
                  <Link href="/network" className="text-primary">
                    Connect
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No other attendees listed"
              description="When more people register and the event completes, you’ll see them here."
            />
          )}
        </Card>
      ) : null}
    </div>
  );
}
