import { jsonOk } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

function mapMentor(id: string, data: Record<string, unknown>) {
  if (data.isDemo || data.mentorApproved !== true) return null;
  const name = String(data.name || "Mentor");
  const skills = Array.isArray(data.skills) ? data.skills.map(String) : [];
  const registration = (data.registration || {}) as Record<string, unknown>;
  return {
    id,
    expertise: (registration.expertise as string) || skills.slice(0, 3).join(", ") || null,
    industry: (data.industry as string) || null,
    experienceYears:
      registration.yearsExperience == null ? null : Number(registration.yearsExperience),
    mentoringTopics:
      skills.length ? skills.join(", ") : (registration.expertise as string) || null,
    availability: (registration.availabilityDays as string) || "Flexible",
    preferredAudience:
      (registration.menteeAudience as string) || "Students & early career",
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
    const snap = await getAdminDb()
      .collection("users")
      .where("mentorApproved", "==", true)
      .limit(40)
      .get();
    const mentors = snap.docs
      .map((d) => mapMentor(d.id, d.data() as Record<string, unknown>))
      .filter(Boolean);
    return jsonOk({ mentors, source: "firestore" });
  } catch {
    return jsonOk({ mentors: [], source: "error" });
  }
}
