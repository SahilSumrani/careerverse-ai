import { prisma } from "@/lib/db";
import { applicationUpdateSchema } from "@/lib/validators";
import { getCareerContext, jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await prisma.application.findMany({
      where: { userId: session.user.id },
      include: { opportunity: true },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk({ items });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load applications", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const opportunityId = String(body.opportunityId || "");
    if (!opportunityId) return jsonError("opportunityId required", 400);

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { skills: { include: { skill: true } } },
    });
    if (!opportunity || opportunity.status !== "PUBLISHED") return jsonError("Opportunity not found", 404);

    const ctx = await getCareerContext(session.user.id);
    const match = ctx
      ? await aiService.jobMatching({
          ctx,
          opportunity: {
            title: opportunity.title,
            description: opportunity.description,
            skills: opportunity.skills.map((s) => s.skill.name).length
              ? opportunity.skills.map((s) => s.skill.name)
              : parseJsonArray(opportunity.skillsJson),
            eligibility: opportunity.eligibility,
            type: opportunity.type,
          },
        })
      : null;

    const app = await prisma.application.upsert({
      where: { userId_opportunityId: { userId: session.user.id, opportunityId } },
      update: {},
      create: {
        userId: session.user.id,
        opportunityId,
        status: "SAVED",
        matchScore: match?.score,
        matchJson: match ? JSON.stringify(match) : null,
      },
      include: { opportunity: true },
    });
    await trackAnalytics("opportunity_saved", session.user.id, { opportunityId });
    await trackAnalytics("application_created", session.user.id, { opportunityId });
    return jsonOk({ application: app });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    console.error(e);
    return jsonError("Unable to create application", 500);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const id = String(body.id || "");
    const parsed = applicationUpdateSchema.safeParse(body);
    if (!id || !parsed.success) return jsonError("Invalid application update", 400);

    const existing = await prisma.application.findFirst({ where: { id, userId: session.user.id } });
    if (!existing) return jsonError("Not found", 404);

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes,
        nextAction: parsed.data.nextAction,
        reminderAt: parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : parsed.data.reminderAt === null ? null : undefined,
        appliedAt: parsed.data.status === "APPLIED" && !existing.appliedAt ? new Date() : existing.appliedAt,
      },
      include: { opportunity: true },
    });
    await createNotification({
      userId: session.user.id,
      type: "APPLICATION_UPDATE",
      title: "Application updated",
      body: `${updated.opportunity.title} is now ${updated.status}`,
      href: "/applications",
    });
    return jsonOk({ application: updated });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to update application", 500);
  }
}
