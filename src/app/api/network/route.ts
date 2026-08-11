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

    if (!people.length) {
      people = [
        {
          id: "demo-net-1",
          name: "Meera Patel",
          email: "meera@demo.careerverse",
          isDemo: true,
          profile: { headline: "CS junior · interested in product design", careerStage: "STUDENT" },
        },
        {
          id: "demo-net-2",
          name: "Kabir Singh",
          email: "kabir@demo.careerverse",
          isDemo: true,
          profile: { headline: "Data analytics intern seeker", careerStage: "EARLY_CAREER" },
        },
        {
          id: "demo-net-3",
          name: "Ananya Rao",
          email: "ananya@demo.careerverse",
          isDemo: true,
          profile: { headline: "Full-stack projects · open to feedback", careerStage: "STUDENT" },
        },
      ];
    }

    return jsonOk({
      people,
      suggestions: people,
      connections: [],
      requests: [],
      sent: [],
      received: [],
      demo: people.some((s) => s.isDemo),
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
