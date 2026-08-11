import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { SEED_EVENTS } from "@/lib/seed-data";
import { EventsBrowseClient } from "@/components/events/events-browse-client";

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
  return <EventsBrowseClient items={items} />;
}
