import { jsonError, jsonOk, readJsonBody, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { getUserById, listDirectoryUsers } from "@/lib/firestore-users";
import { connectionRequestSchema } from "@/lib/validators";
import { consumeDailyQuota } from "@/lib/rate-limit";

const CONNECTION_REQUEST_DAILY_CAP = 30;

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

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    if (!hasFirebaseAdminCredentials()) {
      return jsonError("Network connections are not available yet", 503);
    }
    const body = await readJsonBody(req);
    const parsed = connectionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Provide a valid receiverId to send a connection request", 400);
    }
    if (parsed.data.receiverId === session.user.id) {
      return jsonError("You cannot connect with yourself", 400);
    }
    const receiver = await getUserById(parsed.data.receiverId);
    if (!receiver || receiver.suspendedAt) return jsonError("User not found", 404);
    const quota = await consumeDailyQuota(
      session.user.id,
      "connectionRequests",
      CONNECTION_REQUEST_DAILY_CAP,
    );
    if (!quota.ok) return jsonError("Daily connection request limit reached", 429);

    const now = new Date().toISOString();
    await getAdminDb().collection("connectionRequests").add({
      fromUserId: session.user.id,
      toUserId: parsed.data.receiverId,
      message: parsed.data.message ?? null,
      status: "PENDING",
      createdAt: now,
    });
    return jsonOk({ ok: true, status: "PENDING" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to update network", 500);
  }
}

export async function PATCH(req: Request) {
  return POST(req);
}
