import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { SEED_EVENTS } from "@/lib/seed-data";

export const metadata = {
  title: "Browse events",
  description: "Career events, workshops, and meetups on CareerVerse.",
};

async function loadEvents() {
  if (hasFirebaseAdminCredentials()) {
    try {
      const snap = await getAdminDb().collection("events").limit(30).get();
      if (!snap.empty) {
        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || "Event"),
            organizationName: (data.organizationName as string) || null,
            location: (data.location as string) || "TBA",
            startsAt: String(data.startsAt || new Date().toISOString()),
            type: (data.type as string) || "Meetup",
            blurb: (data.blurb as string) || "",
            isDemo: Boolean(data.isDemo),
          };
        });
      }
      const db = getAdminDb();
      const batch = db.batch();
      for (const e of SEED_EVENTS) {
        batch.set(db.collection("events").doc(e.id), e, { merge: true });
      }
      await batch.commit();
    } catch {
      // seed
    }
  }
  return SEED_EVENTS;
}

export default async function EventsPage() {
  const items = await loadEvents();

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Browse events"
        description="Workshops, career panels, and campus meetups."
      />
      {items.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((e) => (
            <Card key={e.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">
                    <Link href={`/events/${e.id}`} className="hover:text-primary">
                      {e.title}
                    </Link>
                  </CardTitle>
                  {e.isDemo ? <Badge tone="warning">Demo</Badge> : null}
                </div>
                <CardDescription>
                  {e.organizationName || "CareerVerse"} · {e.location} · {e.type}
                </CardDescription>
              </CardHeader>
              <p className="text-sm text-muted-foreground">{e.blurb}</p>
              <p className="mt-3 text-xs font-medium text-muted-foreground">
                {new Date(e.startsAt).toLocaleString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events yet"
          description="Events will appear here when published to Firestore."
        />
      )}
    </div>
  );
}
