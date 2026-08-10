import { prisma } from "@/lib/db";
import { jsonError, jsonOk, requireSession, trackAnalytics } from "@/lib/api";
import { createNotification } from "@/lib/notifications";
import { EventStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const event = await prisma.event.findUnique({
        where: { id },
        include: {
          speakers: { include: { speaker: { include: { user: true } } } },
          organization: true,
          registrations: { include: { user: { include: { profile: true } } } },
          _count: { select: { registrations: true } },
        },
      });
      if (!event) return jsonError("Event not found", 404);
      return jsonOk({ event });
    }
    const events = await prisma.event.findMany({
      where: { status: { in: [EventStatus.PUBLISHED, EventStatus.LIVE, EventStatus.COMPLETED] } },
      include: {
        speakers: { include: { speaker: { include: { user: true } } } },
        _count: { select: { registrations: true } },
      },
      orderBy: { date: "asc" },
      take: 50,
    });
    return jsonOk({ events });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to load events", 500);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const eventId = String(body.eventId || "");
    if (!eventId) return jsonError("eventId required", 400);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event || (event.status !== "PUBLISHED" && event.status !== "LIVE")) {
      return jsonError("Event not available", 404);
    }
    if (event.capacity) {
      const count = await prisma.eventRegistration.count({ where: { eventId } });
      if (count >= event.capacity) return jsonError("Event is at capacity", 409);
    }
    const registration = await prisma.eventRegistration.upsert({
      where: { eventId_userId: { eventId, userId: session.user.id } },
      update: { status: "registered" },
      create: { eventId, userId: session.user.id, status: "registered" },
    });
    await createNotification({
      userId: session.user.id,
      type: "EVENT_REGISTRATION",
      title: "Registered for event",
      body: event.title,
      href: `/events/${eventId}`,
    });
    await trackAnalytics("event_registered", session.user.id, { eventId });
    return jsonOk({ registration });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to register", 500);
  }
}
