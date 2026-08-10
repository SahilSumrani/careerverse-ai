import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (q.length < 2) return jsonOk({ opportunities: [], people: [], events: [], careers: [], posts: [] });

    const [opportunities, people, events, careers, posts] = await Promise.all([
      prisma.opportunity.findMany({
        where: {
          status: "PUBLISHED",
          OR: [{ title: { contains: q } }, { description: { contains: q } }, { organizationName: { contains: q } }],
        },
        take: 8,
      }),
      prisma.user.findMany({
        where: {
          OR: [{ name: { contains: q } }, { email: { contains: q } }, { profile: { headline: { contains: q } } }],
          suspendedAt: null,
        },
        include: { profile: true },
        take: 8,
      }),
      prisma.event.findMany({
        where: { OR: [{ title: { contains: q } }, { description: { contains: q } }] },
        take: 8,
      }),
      prisma.career.findMany({
        where: { OR: [{ title: { contains: q } }, { summary: { contains: q } }] },
        take: 8,
      }),
      prisma.post.findMany({
        where: { OR: [{ title: { contains: q } }, { content: { contains: q } }] },
        take: 8,
      }),
    ]);

    return jsonOk({ opportunities, people, events, careers, posts });
  } catch (e) {
    console.error(e);
    return jsonError("Search failed", 500);
  }
}

export async function POST(req: Request) {
  // Interview prep / roadmap helpers
  try {
    const session = await auth();
    if (!session?.user?.id) return jsonError("Unauthorized", 401);
    const body = await req.json();
    const ctx = await getCareerContext(session.user.id);
    if (body.action === "interview") {
      const result = await aiService.interviewPreparation({
        targetRole: String(body.targetRole || "Target role"),
        jobDescription: body.jobDescription,
        resumeText: ctx?.resumeText ?? undefined,
        experienceLevel: ctx?.careerStage ?? undefined,
        ctx: ctx ?? undefined,
      });
      return jsonOk({ result });
    }
    if (body.action === "roadmap") {
      const result = await aiService.roadmapGeneration({
        careerTitle: String(body.careerTitle || "Software Developer"),
        ctx: ctx ?? {
          skills: [],
          interests: [],
          preferredIndustries: [],
          preferredLocations: [],
          profileCompleteness: 0,
        },
      });
      return jsonOk({ result });
    }
    return jsonError("Unknown action", 400);
  } catch (e) {
    console.error(e);
    return jsonError("Unable to run search action", 500);
  }
}
