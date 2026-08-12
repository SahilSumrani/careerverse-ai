import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials } from "@/lib/firebase-admin";
import { listDirectoryUsers } from "@/lib/firestore-users";

export async function GET() {
  try {
    const session = await requireSession();
    let people: Array<{
      id: string;
      name?: string | null;
      email: string;
      isDemo?: boolean;
      profile?: { headline?: string | null; careerStage?: string | null } | null;
      mentorProfile?: { expertise?: string | null } | null;
      roles?: Array<{ role: { name: string } }>;
    }> = [];

    if (hasFirebaseAdminCredentials()) {
      try {
        const users = await listDirectoryUsers(session.user.id, 12);
        people = users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          profile: {
            headline: u.headline || u.degree || u.careerGoals?.slice(0, 80) || null,
            careerStage: u.careerStage ?? null,
          },
          roles: u.roles.map((r) => ({ role: { name: r } })),
        }));
      } catch {
        people = [];
      }
    }

    return jsonOk({
      people,
      suggestions: people,
      connections: [],
      requests: [],
      sent: [],
      received: [],
      demo: false,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load network", 500);
  }
}

export async function POST() {
  try {
    await requireSession();
    return jsonOk({
      ok: true,
      note: "Connection request acknowledged. Full connections collection can persist this next.",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update network", 500);
  }
}

export async function PATCH() {
  return POST();
}
