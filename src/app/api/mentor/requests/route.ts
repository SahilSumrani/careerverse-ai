import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminDb, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export interface MentorshipRequestDoc {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  mentorId: string;
  mentorName: string;
  topic: string;
  notes?: string;
  scheduledDate: string;
  scheduledTime?: string;
  meetingUrl?: string;
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
}

// GET /api/mentor/requests?role=student|mentor
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json({ items: [] });
    }

    const db = getAdminDb();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "student";

    let query = db.collection("mentorship_requests");
    if (role === "mentor") {
      const snap = await query.where("mentorId", "==", session.user.id).limit(50).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ items });
    } else {
      const snap = await query.where("studentId", "==", session.user.id).limit(50).get();
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ items });
    }
  } catch (error: any) {
    console.error("Error fetching mentorship requests:", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

// POST /api/mentor/requests — Student books a session with a mentor
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { mentorId, mentorName, topic, notes, scheduledDate, scheduledTime } = body;

    if (!mentorId || !topic) {
      return NextResponse.json({ error: "Mentor and topic are required" }, { status: 400 });
    }

    const db = getAdminDb();

    // Fetch mentor's default meeting URL if set
    let defaultMeetingUrl = "";
    try {
      const mentorDoc = await db.collection("users").doc(mentorId).get();
      if (mentorDoc.exists) {
        defaultMeetingUrl = mentorDoc.data()?.mentorProfile?.meetingUrl || "";
      }
    } catch {}

    const now = new Date().toISOString();
    const requestData: Omit<MentorshipRequestDoc, "id"> = {
      studentId: session.user.id,
      studentName: session.user.name || "Student",
      studentEmail: session.user.email || "",
      mentorId,
      mentorName: mentorName || "Mentor",
      topic,
      notes: notes || "",
      scheduledDate: scheduledDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      scheduledTime: scheduledTime || "11:00 AM",
      meetingUrl: defaultMeetingUrl,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("mentorship_requests").add(requestData);
    return NextResponse.json({ success: true, id: docRef.id, request: { id: docRef.id, ...requestData } });
  } catch (error: any) {
    console.error("Error creating mentorship request:", error);
    return NextResponse.json({ error: "Failed to book mentorship session" }, { status: 500 });
  }
}

// PATCH /api/mentor/requests — Mentor updates status (CONFIRMED, DECLINED, COMPLETED)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { requestId, status, meetingUrl } = body;

    if (!requestId || !status) {
      return NextResponse.json({ error: "Request ID and status are required" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection("mentorship_requests").doc(requestId);
    const doc = await ref.get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const data = doc.data();
    // Allow mentor of the session, or the student (for cancelling)
    if (data?.mentorId !== session.user.id && data?.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatePayload: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (meetingUrl) updatePayload.meetingUrl = meetingUrl;

    await ref.update(updatePayload);
    return NextResponse.json({ success: true, updated: updatePayload });
  } catch (error: any) {
    console.error("Error updating mentorship request:", error);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
