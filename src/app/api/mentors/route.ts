import { jsonOk } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

function mapMentor(id: string, data: Record<string, unknown>) {
  if (data.isDemo) return null;
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
    isDemo: false,
    user: {
      id,
      name,
      profile: { headline: (data.headline as string) || null },
    },
  };
}

export async function GET() {
  if (!hasFirebaseAdminCredentials()) {
    return jsonOk({ mentors: [], source: "unconfigured" });
  }
  try {
    const snap = await getAdminDb().collection("mentors").limit(40).get();
    const mentors = snap.docs
      .map((d) => mapMentor(d.id, d.data() as Record<string, unknown>))
      .filter(Boolean);
    return jsonOk({ mentors, source: "firestore" });
  } catch {
    return jsonOk({ mentors: [], source: "error" });
  }
}
