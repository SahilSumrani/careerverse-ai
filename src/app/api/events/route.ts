import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

async function listEvents() {
  if (!hasFirebaseAdminCredentials()) {
    return { items: [], source: "unconfigured" as const };
  }
  try {
    const snap = await getAdminDb().collection("events").limit(40).get();
    const items = snap.docs
      .map((d) => {
        const data = d.data();
        if (data.isDemo) return null;
        return {
          id: d.id,
          title: String(data.title || "Event"),
          organizationName: data.organizationName || null,
          location: data.location || "TBA",
          startsAt: String(data.startsAt || new Date().toISOString()),
          endsAt: data.endsAt ? String(data.endsAt) : null,
          type: data.type || "Meetup",
          blurb: data.blurb || "",
          isDemo: false,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      title: string;
      organizationName: string | null;
      location: string;
      startsAt: string;
      endsAt: string | null;
      type: string;
      blurb: string;
      isDemo: boolean;
    }>;
    items.sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));
    return { items, source: "firestore" as const };
  } catch {
    return { items: [], source: "error" as const };
  }
}

export async function GET() {
  const { items, source } = await listEvents();
  return jsonOk({ items, source });
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Event registration is not available yet", 503);
    }
    const body = await req.json().catch(() => ({}));
    const eventId = String(body.eventId || "").trim();
    if (!eventId || eventId.length > 128) {
      return jsonError("eventId required", 400);
    }
    const now = new Date().toISOString();
    await getAdminDb().collection("eventRsvps").add({
      eventId,
      userId: session.user.id,
      createdAt: now,
      status: "REGISTERED",
    });
    return jsonOk({ ok: true, eventId, status: "REGISTERED" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to register", 500);
  }
}
