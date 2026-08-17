import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { deterministicJobMatch } from "@/lib/ai/service";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { getUserById, listTopTalentStudents } from "@/lib/firestore-users";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";

async function requireApprovedRecruiter() {
  const session = await requireSession();
  await requirePermission(session.user.id, PERMISSIONS.OPPORTUNITY_CREATE);
  const user = await getUserById(session.user.id);
  const isAdmin = Boolean(user?.roles.includes("PLATFORM_ADMIN"));
  if (!isAdmin && !user?.recruiterApproved) {
    throw Object.assign(new Error("Recruiter inbox requires admin approval"), {
      status: 403,
      companyName: user?.registration?.companyName ?? null,
    });
  }
  return { session, isAdmin };
}

/** Top Talent: careerScore >= 90 ∩ top 20% of scored students. */
export async function GET(req: Request) {
  try {
    const { session, isAdmin } = await requireApprovedRecruiter();
    if (!hasFirebaseAdminCredentials()) {
      return jsonOk({ items: [], scoredCount: 0, cutoffK: 0, source: "unconfigured" });
    }

    const jobId = new URL(req.url).searchParams.get("jobId")?.trim() || "";
    const { items, scoredCount, cutoffK } = await listTopTalentStudents({
      minScore: 90,
      topFraction: 0.2,
      limit: 50,
    });

    let job:
      | { id: string; createdBy: string; title: string; blurb: string; tags: string[]; type: string }
      | null = null;
    if (jobId) {
      const snap = await getAdminDb().collection("jobs").doc(jobId).get();
      if (!snap.exists) return jsonError("Job not found", 404);
      const data = snap.data() as Record<string, unknown>;
      const createdBy = String(data.createdBy || "");
      if (!isAdmin && createdBy !== session.user.id) return jsonError("Forbidden", 403);
      const tagsRaw = data.tags || data.skills;
      job = {
        id: snap.id,
        createdBy,
        title: String(data.title || "Role"),
        blurb: String(data.blurb || ""),
        tags: Array.isArray(tagsRaw) ? tagsRaw.map(String) : [],
        type: String(data.type || "Full-time"),
      };
    }

    const selectedJob = job;
    const talent = selectedJob
      ? items.map((row) => {
          const match = deterministicJobMatch(
            {
              name: row.name,
              skills: row.skills,
              interests: [],
              preferredIndustries: [],
              preferredLocations: [],
              profileCompleteness: 0,
              careerScore: row.careerScore,
            },
            {
              title: selectedJob.title,
              description: selectedJob.blurb,
              skills: selectedJob.tags,
              type: selectedJob.type,
            },
          );
          return {
            ...row,
            matchScore: match.score,
            matchReasons: match.reasons.slice(0, 2),
          };
        })
      : items.map((row) => ({ ...row, matchScore: null as number | null, matchReasons: [] as string[] }));

    if (selectedJob) talent.sort((a, b) => Number(b.matchScore ?? 0) - Number(a.matchScore ?? 0));

    return jsonOk({
      items: talent,
      scoredCount,
      cutoffK,
      minScore: 90,
      topFraction: 0.2,
      source: "firestore",
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) {
      return jsonError("Recruiter inbox requires admin approval", 403, {
        pending: true,
        companyName: (e as { companyName?: string | null }).companyName ?? null,
      });
    }
    return jsonError("Unable to load top talent", 500);
  }
}
