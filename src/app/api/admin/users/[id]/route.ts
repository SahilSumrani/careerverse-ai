import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { getAdminDb, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";
import { mapUserDoc, USERS_COLLECTION } from "@/lib/firestore-users";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const QUERY_LIMIT = 50;

function timestamp(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "toDate" in value) {
    try {
      return (value as { toDate(): Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    const { id } = await params;
    if (!USER_ID_PATTERN.test(id)) return jsonError("Invalid user id", 400);
    if (!hasFirebaseAdminCredentials()) return jsonError("Admin backend unavailable", 503);

    const db = getAdminDb();
    const [userSnap, applicationsSnap, analyticsSnap, aiUsageSnap] = await Promise.all([
      db.collection(USERS_COLLECTION).doc(id).get(),
      db.collection("applications").where("userId", "==", id).limit(QUERY_LIMIT).get(),
      db.collection("analyticsEvents").where("userId", "==", id).limit(QUERY_LIMIT).get(),
      db.collection("aiUsage").where("userId", "==", id).limit(QUERY_LIMIT).get(),
    ]);

    if (!userSnap.exists) return jsonError("User not found", 404);
    const user = mapUserDoc(userSnap.id, userSnap.data());
    if (!user) return jsonError("User not found", 404);

    const byNewest = <T extends { createdAt: string | null }>(rows: T[]) =>
      rows.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const applications = byNewest(
      applicationsSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const opportunity =
          data.opportunity && typeof data.opportunity === "object"
            ? (data.opportunity as Record<string, unknown>)
            : null;
        return {
          id: doc.id,
          opportunityId:
            typeof data.opportunityId === "string"
              ? data.opportunityId
              : typeof opportunity?.id === "string"
                ? opportunity.id
                : null,
          status: typeof data.status === "string" ? data.status : null,
          createdAt: timestamp(data.createdAt),
          updatedAt: timestamp(data.updatedAt),
        };
      }),
    );

    const analyticsEvents = byNewest(
      analyticsSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          name: typeof data.name === "string" ? data.name : "event",
          props:
            data.props && typeof data.props === "object" && !Array.isArray(data.props)
              ? (data.props as Record<string, unknown>)
              : null,
          createdAt: timestamp(data.createdAt),
        };
      }),
    );

    const aiUsage = byNewest(
      aiUsageSnap.docs.map((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          operation: typeof data.operation === "string" ? data.operation : "unknown",
          model: typeof data.model === "string" ? data.model : null,
          tokensIn: Number(data.tokensIn || 0),
          tokensOut: Number(data.tokensOut || 0),
          success: Boolean(data.success),
          createdAt: timestamp(data.createdAt),
        };
      }),
    );

    const resumes = [user.resume, ...(user.resumes || [])]
      .filter((resume): resume is NonNullable<typeof resume> => Boolean(resume))
      .filter((resume, index, all) => all.findIndex((item) => item.id === resume.id) === index)
      .map((resume) => ({ fileName: resume.fileName, uploadedAt: resume.uploadedAt }));

    return jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        registration: user.registration,
        recruiterApproved: user.recruiterApproved ?? false,
        mentorApproved: user.mentorApproved ?? false,
        suspendedAt: user.suspendedAt ?? null,
        onboardingComplete: user.onboardingComplete,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        education: user.education ?? null,
        degree: user.degree ?? null,
        college: user.college ?? null,
        graduationYear: user.graduationYear ?? null,
        careerGoals: user.careerGoals ?? null,
        skills: user.skills,
        interests: user.interests,
        preferredIndustries: user.preferredIndustries,
        preferredLocations: user.preferredLocations,
        workPreference: user.workPreference ?? null,
        careerStage: user.careerStage ?? null,
        resumes,
      },
      applications,
      analyticsEvents,
      aiUsage,
    });
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    console.error("Unable to load admin user detail", error);
    return jsonError("Unable to load user detail", 500);
  }
}
