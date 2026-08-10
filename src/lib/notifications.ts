import { prisma } from "@/lib/db";

export async function createNotification(input: {
  userId: string;
  type:
    | "APPLICATION_UPDATE"
    | "EVENT_REGISTRATION"
    | "CONNECTION_REQUEST"
    | "APPROVAL_UPDATE"
    | "OPPORTUNITY_ALERT"
    | "COMMUNITY_ACTIVITY"
    | "SYSTEM";
  title: string;
  body: string;
  href?: string;
}) {
  return prisma.notification.create({ data: input });
}

export async function audit(input: {
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      metaJson: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}
