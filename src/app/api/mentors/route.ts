import { jsonOk } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { SEED_MENTORS } from "@/lib/seed-data";

function mapMentor(id: string, data: Record<string, unknown>) {
  const name = String(data.name || "Mentor");
  const skills = Array.isArray(data.skills) ? data.skills.map(String) : [];
  return {
    id,
    expertise: (data.focus as string) || skills.slice(0, 3).join(", ") || null,
    industry: (data.industry as string) || null,
    experienceYears: data.experienceYears == null ? null : Number(data.experienceYears),
    mentoringTopics: skills.length ? skills.join(", ") : (data.focus as string) || null,
    availability: (data.availability as string) || "Flexible",
    preferredAudience: (data.preferredAudience as string) || "Students & early career",
    isDemo: Boolean(data.isDemo),
    user: {
      id: id,
      name,
      profile: { headline: (data.headline as string) || null },
    },
  };
}

export async function GET() {
  if (hasFirebaseAdminCredentials()) {
    try {
      const snap = await getAdminDb().collection("mentors").limit(20).get();
      if (!snap.empty) {
        const mentors = snap.docs.map((d) => mapMentor(d.id, d.data() as Record<string, unknown>));
        return jsonOk({ mentors, source: "firestore" });
      }
      const db = getAdminDb();
      const batch = db.batch();
      for (const m of SEED_MENTORS) {
        batch.set(db.collection("mentors").doc(m.id), m, { merge: true });
      }
      await batch.commit();
    } catch {
      // fall through
    }
  }
  return jsonOk({
    mentors: SEED_MENTORS.map((m) => mapMentor(m.id, m as unknown as Record<string, unknown>)),
    source: "seed",
  });
}
