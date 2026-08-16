import { jsonError, jsonOk, readJsonBody, requireSession, getCareerContext } from "@/lib/api";
import { auth } from "@/lib/auth";
import { aiService } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";
import { getUserById } from "@/lib/firestore-users";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { opportunityCreateSchema } from "@/lib/validators";
import { consumeDailyQuota } from "@/lib/rate-limit";

const MATCH_TOP_N = 8;
const MATCH_DAILY_CAP = Number(process.env.AI_MATCH_DAILY_CAP || 10);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").slice(0, 120).toLowerCase();
  const mine = searchParams.get("mine") === "1";
  const { jobs, source } = await loadJobsFromFirestore(50);

  let filtered = jobs;
  if (mine) {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    if (!hasFirebaseAdminCredentials()) return jsonOk({ items: [], source: "unconfigured" });
    try {
      const snap = await getAdminDb()
        .collection("jobs")
        .where("createdBy", "==", session.user.id)
        .limit(50)
        .get();
      filtered = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: String(data.title || "Role"),
          company: String(data.company || "Company"),
          location: String(data.location || "TBA"),
          type: String(data.type || "Full-time"),
          workMode: String(data.workMode || "Hybrid"),
          salary: data.salary ? String(data.salary) : undefined,
          tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
          blurb: String(data.blurb || ""),
          isDemo: Boolean(data.isDemo),
        };
      });
    } catch {
      filtered = [];
    }
  }

  let items = filtered.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.blurb,
    organizationName: j.company,
    location: j.location,
    type: j.type,
    workMode: j.workMode,
    skillsJson: JSON.stringify(j.tags),
    skills: j.tags.map((name) => ({ skill: { name } })),
    status: "PUBLISHED",
    isDemo: false,
    createdAt: new Date().toISOString(),
  }));

  if (q) {
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.organizationName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  }

  const session = await auth();
  const ctx = !mine && session?.user?.id ? await getCareerContext(session.user.id) : null;
  const matchQuota =
    ctx && items.length
      ? await consumeDailyQuota(session!.user.id, "jobMatching", MATCH_DAILY_CAP)
      : { ok: false, remaining: 0 };
  const withMatch = ctx && matchQuota.ok
    ? await Promise.all(
        items.map(async (o, index) => {
          if (index >= MATCH_TOP_N) return o;
          return {
            ...o,
            match: await aiService.jobMatching({
              ctx,
              opportunity: {
                title: o.title,
                description: o.description,
                skills: o.skills.map((s) => s.skill.name),
                eligibility: null,
                type: o.type,
              },
            }),
          };
        }),
      )
    : items;

  return jsonOk({
    items: withMatch,
    total: withMatch.length,
    page: 1,
    pageSize: withMatch.length,
    source: mine ? "firestore" : source,
    matchedTopN: ctx && matchQuota.ok ? Math.min(MATCH_TOP_N, items.length) : 0,
    matchRemaining: ctx ? matchQuota.remaining : null,
  });
}

/** Approved recruiters (HR + recruiterApproved) or PLATFORM_ADMIN may publish jobs. */
export async function POST(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.OPPORTUNITY_CREATE);

    const user = await getUserById(session.user.id);
    const isAdmin = user?.roles.includes("PLATFORM_ADMIN");
    if (!isAdmin && !user?.recruiterApproved) {
      return jsonError("Recruiter posting requires admin approval", 403);
    }
    if (!hasFirebaseAdminCredentials()) return jsonError("Jobs backend unavailable", 503);

    const body = await readJsonBody(req);
    const parsed = opportunityCreateSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid job payload", 400);

    const now = new Date().toISOString();
    const payload = {
      ...parsed.data,
      isDemo: false,
      status: "PUBLISHED",
      createdBy: session.user.id,
      publishedAt: now,
      updatedAt: now,
    };
    const ref = await getAdminDb().collection("jobs").add(payload);
    return jsonOk({ job: { id: ref.id, ...payload }, source: "firestore" });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403) return jsonError("Forbidden", 403);
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    return jsonError("Unable to create job", 500);
  }
}
