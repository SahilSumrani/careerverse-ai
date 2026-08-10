import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const session = await requireSession();
    const items = await prisma.approvalRequest.findMany({
      where: { requesterId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const institutions = await prisma.institution.findMany({
      include: { organization: true },
      take: 20,
    });
    return jsonOk({ items, institutions });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load approvals", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const type = String(body.type || "");
    const institutionId = body.institutionId ? String(body.institutionId) : null;
    const payload = body.payload ?? {};
    if (!["student_verification", "internship", "job", "event_participation"].includes(type)) {
      return jsonError("Unsupported approval type", 400);
    }
    const approval = await prisma.approvalRequest.create({
      data: {
        type,
        requesterId: session.user.id,
        institutionId,
        payloadJson: JSON.stringify(payload),
        status: "PENDING",
      },
    });
    await createNotification({
      userId: session.user.id,
      type: "APPROVAL_UPDATE",
      title: "Approval request submitted",
      body: `Your ${type.replaceAll("_", " ")} request is pending review`,
      href: "/institutions",
    });
    return jsonOk({ approval });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to create approval request", 500);
  }
}
