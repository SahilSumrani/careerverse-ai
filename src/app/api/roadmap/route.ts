import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService, CAREER_CATALOG } from "@/lib/ai/service";
import { auth } from "@/lib/auth";
import { consumeDailyQuota } from "@/lib/rate-limit";

const ROADMAP_DAILY_CAP = Number(process.env.AI_ROADMAP_DAILY_CAP || 12);

function slugId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "career";
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const quota = await consumeDailyQuota(session.user.id, "roadmapGenerate", ROADMAP_DAILY_CAP);
    if (!quota.ok) return jsonError("Daily roadmap generation limit reached. Try again tomorrow.", 429);

    const body = await req.json().catch(() => ({}));
    const careerTitle = String(body.careerTitle || body.title || "").trim();
    if (!careerTitle) return jsonError("careerTitle required", 400);

    const ctx = await getCareerContext(session.user.id);
    if (!ctx) return jsonError("Complete onboarding so we can personalize your roadmap", 400);

    const extraGaps = Array.isArray(body.skillGaps) ? body.skillGaps.map(String).slice(0, 12) : [];
    const mergedCtx = {
      ...ctx,
      skillGaps: Array.from(new Set([...(ctx.skillGaps || []), ...extraGaps])).slice(0, 12),
    };

    const result = await aiService.roadmapGeneration({
      careerTitle,
      ctx: mergedCtx,
    });
    return jsonOk({ result, remaining: quota.remaining });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to generate roadmap", 500);
  }
}

export async function GET() {
  const careers = CAREER_CATALOG.map((c) => ({
    id: slugId(c.title),
    title: c.title,
    skills: c.skills,
  }));

  let suggested: string[] = [];
  try {
    const session = await auth();
    if (session?.user?.id) {
      const ctx = await getCareerContext(session.user.id);
      suggested = ctx?.topPaths?.length
        ? ctx.topPaths
        : ctx?.careerGoals
          ? [ctx.careerGoals.split(/[.\n]/)[0]?.trim()].filter(Boolean).slice(0, 1)
          : [];
    }
  } catch {
    // public catalog still returned
  }

  return jsonOk({ careers, suggested, source: "catalog" });
}
