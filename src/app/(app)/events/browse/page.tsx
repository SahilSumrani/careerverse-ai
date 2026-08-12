import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { EventsBrowseClient } from "@/components/events/events-browse-client";

export const metadata = {
  title: "Browse events",
  description: "Career events, workshops, and meetups on CareerVerse.",
};

async function loadEvents() {
  if (!hasFirebaseAdminCredentials()) return [];
  try {
    const snap = await getAdminDb().collection("events").limit(40).get();
    return snap.docs
      .map((d) => {
        const data = d.data();
        if (data.isDemo) return null;
        return {
          id: d.id,
          title: String(data.title || "Event"),
          organizationName: (data.organizationName as string) || null,
          location: (data.location as string) || "TBA",
          startsAt: String(data.startsAt || new Date().toISOString()),
          type: (data.type as string) || "Meetup",
          blurb: (data.blurb as string) || "",
          isDemo: false,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      organizationName: string | null;
      location: string;
      startsAt: string;
      type: string;
      blurb: string;
      isDemo: boolean;
    }>;
  } catch {
    return [];
  }
}

export default async function EventsPage() {
  const items = await loadEvents();
  return <EventsBrowseClient items={items} />;
}
