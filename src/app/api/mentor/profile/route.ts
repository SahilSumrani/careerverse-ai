import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAdminDb, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// GET /api/mentor/profile — Get mentor profile settings
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasFirebaseAdminCredentials()) {
      return NextResponse.json({ profile: null });
    }

    const db = getAdminDb();
    const doc = await db.collection("users").doc(session.user.id).get();
    if (!doc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data = doc.data() || {};
    return NextResponse.json({
      profile: {
        isAvailable: data.mentorProfile?.isAvailable ?? true,
        meetingUrl: data.mentorProfile?.meetingUrl || "",
        expertise: data.mentorProfile?.expertise || data.registration?.expertise || "",
        availableDays: data.mentorProfile?.availableDays || "Mon, Wed, Fri",
        hourlySlots: data.mentorProfile?.hourlySlots || "10:00 AM - 4:00 PM",
        bio: data.mentorProfile?.bio || data.headline || "",
      },
    });
  } catch (error: any) {
    console.error("Error fetching mentor profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PATCH /api/mentor/profile — Update mentor profile settings
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
    const { isAvailable, meetingUrl, expertise, availableDays, hourlySlots, bio } = body;

    const db = getAdminDb();
    const ref = db.collection("users").doc(session.user.id);

    const updateData = {
      mentorProfile: {
        isAvailable: isAvailable ?? true,
        meetingUrl: meetingUrl || "",
        expertise: expertise || "",
        availableDays: availableDays || "Mon, Wed, Fri",
        hourlySlots: hourlySlots || "10:00 AM - 4:00 PM",
        bio: bio || "",
        updatedAt: new Date().toISOString(),
      },
    };

    await ref.set(updateData, { merge: true });
    return NextResponse.json({ success: true, profile: updateData.mentorProfile });
  } catch (error: any) {
    console.error("Error updating mentor profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
