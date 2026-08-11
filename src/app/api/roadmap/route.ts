import { getCareerContext, jsonError, jsonOk, requireSession } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const careerTitle = String(body.careerTitle || body.title || "").trim();
    if (!careerTitle) return jsonError("careerTitle required", 400);

    const ctx = await getCareerContext(session.user.id);
    if (!ctx) return jsonError("Complete onboarding so we can personalize your roadmap", 400);

    // Merge skill gaps saved from Career Intelligence
    const extraGaps = Array.isArray(body.skillGaps) ? body.skillGaps.map(String).slice(0, 12) : [];
    const mergedCtx = {
      ...ctx,
      skillGaps: Array.from(new Set([...(ctx.skillGaps || []), ...extraGaps])).slice(0, 12),
    };

    const result = await aiService.roadmapGeneration({
      careerTitle,
      ctx: mergedCtx,
    });
    return jsonOk({ result });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to generate roadmap", 500);
  }
}

export async function GET() {
  const { CAREER_ROADMAP_ROLES } = await import("@/data/career-roadmaps");
  return jsonOk({
    careers: CAREER_ROADMAP_ROLES.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      isDemo: r.isDemo ?? true,
    })),
  });
}
