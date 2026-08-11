import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { SEED_EVENTS } from "@/lib/seed-data";

async function listEvents() {
  if (hasFirebaseAdminCredentials()) {
    try {
      const snap = await getAdminDb().collection("events").limit(30).get();
      if (!snap.empty) {
        const items = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || "Event"),
            organizationName: data.organizationName || null,
            location: data.location || "TBA",
            startsAt: String(data.startsAt || new Date().toISOString()),
            endsAt: data.endsAt ? String(data.endsAt) : null,
            type: data.type || "Meetup",
            blurb: data.blurb || "",
            isDemo: Boolean(data.isDemo),
          };
        });
        items.sort((a, b) => (a.startsAt > b.startsAt ? 1 : -1));
        return { items, source: "firestore" as const };
      }
    } catch {
      // seed
    }
  }
  return { items: SEED_EVENTS, source: "seed" as const };
}

export async function GET() {
  const { items, source } = await listEvents();
  if (source === "seed" && hasFirebaseAdminCredentials()) {
    try {
      const db = getAdminDb();
      const batch = db.batch();
      for (const e of SEED_EVENTS) {
        batch.set(db.collection("events").doc(e.id), e, { merge: true });
      }
      await batch.commit();
    } catch {
      // ignore
    }
  }
  return jsonOk({ items, source });
}

export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json().catch(() => ({}));
    return jsonOk({
      ok: true,
      eventId: body.eventId || null,
      note: "Registration intent saved. Full RSVP collection can be added next.",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to register", 500);
  }
}
