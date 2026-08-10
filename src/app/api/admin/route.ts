import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { requirePermission, PERMISSIONS } from "@/lib/rbac";
import { audit } from "@/lib/notifications";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

    const [users, opportunities, events, reports, approvals, aiUsage, analytics] = await Promise.all([
      prisma.user.count(),
      prisma.opportunity.count(),
      prisma.event.count(),
      prisma.report.count({ where: { status: "open" } }),
      prisma.approvalRequest.count({ where: { status: "PENDING" } }),
      prisma.aiUsage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.analyticsEvent.groupBy({
        by: ["name"],
        _count: { name: true },
        orderBy: { _count: { name: "desc" } },
        take: 12,
      }),
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { roles: { include: { role: true } }, profile: true },
    });
    const pendingOpps = await prisma.opportunity.findMany({
      where: { status: "PENDING_REVIEW" },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    const pendingApprovals = await prisma.approvalRequest.findMany({
      where: { status: "PENDING" },
      include: { requester: true, institution: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return jsonOk({
      overview: { users, opportunities, events, reports, approvals },
      recentUsers,
      pendingOpps,
      pendingApprovals,
      aiUsage,
      analytics,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403 || (e as Error).message === "Forbidden") return jsonError("Forbidden", 403);
    console.error(e);
    return jsonError("Unable to load admin data", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "opportunity_status") {
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!id || !["PUBLISHED", "REJECTED", "ARCHIVED", "CLOSED"].includes(status)) {
        return jsonError("Invalid opportunity moderation", 400);
      }
      const mapped = status === "REJECTED" ? "ARCHIVED" : status;
      const opp = await prisma.opportunity.update({
        where: { id },
        data: { status: mapped as never },
      });
      await audit({
        actorId: session.user.id,
        action: `opportunity.${mapped.toLowerCase()}`,
        targetType: "opportunity",
        targetId: id,
      });
      return jsonOk({ opportunity: opp });
    }

    if (action === "approval_decide") {
      const id = String(body.id || "");
      const status = body.status === "APPROVED" ? "APPROVED" : "REJECTED";
      const note = String(body.note || "");
      const approval = await prisma.approvalRequest.update({
        where: { id },
        data: {
          status,
          reviewerId: session.user.id,
          decisionNote: note || null,
        },
      });
      await createNotification({
        userId: approval.requesterId,
        type: "APPROVAL_UPDATE",
        title: `Request ${status.toLowerCase()}`,
        body: note || `Your ${approval.type} request was ${status.toLowerCase()}`,
        href: "/institutions",
      });
      await audit({
        actorId: session.user.id,
        action: `approval.${status.toLowerCase()}`,
        targetType: "approval",
        targetId: id,
      });
      return jsonOk({ approval });
    }

    if (action === "suspend_user") {
      const id = String(body.id || "");
      const user = await prisma.user.update({
        where: { id },
        data: { suspendedAt: new Date() },
      });
      await audit({
        actorId: session.user.id,
        action: "user.suspend",
        targetType: "user",
        targetId: id,
      });
      return jsonOk({ user: { id: user.id, suspendedAt: user.suspendedAt } });
    }

    return jsonError("Unknown admin action", 400);
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    if (status === 403 || (e as Error).message === "Forbidden") return jsonError("Forbidden", 403);
    console.error(e);
    return jsonError("Admin action failed", 500);
  }
}
