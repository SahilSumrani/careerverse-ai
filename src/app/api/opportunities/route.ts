import { OpportunityStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { opportunityFilterSchema } from "@/lib/validators";
import { getCareerContext, jsonError, jsonOk } from "@/lib/api";
import { auth } from "@/lib/auth";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = opportunityFilterSchema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return jsonError("Invalid filters", 400);
    const { q, type, location, workMode, skill, page, pageSize } = parsed.data;

    const where: Prisma.OpportunityWhereInput = {
      status: OpportunityStatus.PUBLISHED,
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q } },
                { description: { contains: q } },
                { organizationName: { contains: q } },
              ],
            }
          : {},
        type ? { type: type as never } : {},
        location ? { location: { contains: location } } : {},
        workMode ? { workMode: workMode as never } : {},
        skill
          ? {
              OR: [{ skillsJson: { contains: skill } }, { skills: { some: { skill: { name: { contains: skill } } } } }],
            }
          : {},
      ],
    };

    const [total, items] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        include: { skills: { include: { skill: true } }, organization: true },
        orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const session = await auth();
    const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
    const withMatches = await Promise.all(
      items.map(async (item) => {
        const skills = item.skills.map((s) => s.skill.name);
        const match = ctx
          ? await aiService.jobMatching({
              ctx,
              opportunity: {
                title: item.title,
                description: item.description,
                skills: skills.length ? skills : parseJsonArray(item.skillsJson),
                eligibility: item.eligibility,
                type: item.type,
              },
            })
          : null;
        return { ...item, match };
      }),
    );

    return jsonOk({ items: withMatches, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to load opportunities", 500);
  }
}
