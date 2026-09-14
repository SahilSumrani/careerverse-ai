import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attachResumeMeta, getUserById, USERS_COLLECTION } from "@/lib/firestore-users";
import { getAdminDb, hasFirebaseAdminCredentials } from "@/lib/firebase-admin";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to save your resume to your account." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { resumeData, templateId, title } = body;

    if (!resumeData || !resumeData.personalInfo) {
      return NextResponse.json({ error: "Invalid resume data." }, { status: 400 });
    }

    const userId = session.user.id;
    const resumeId = nanoid(10);
    const resumeName = title || `${resumeData.personalInfo.fullName || "My"}_Resume_${new Date().toISOString().slice(0, 10)}`;

    if (hasFirebaseAdminCredentials()) {
      const db = getAdminDb();
      // Store in users subcollection or user document
      const resumeDocRef = db.collection(USERS_COLLECTION).doc(userId).collection("builderResumes").doc(resumeId);
      await resumeDocRef.set({
        id: resumeId,
        name: resumeName,
        templateId: templateId || "executive",
        data: resumeData,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      // Also attach to user's resume meta so it appears in /resume ATS dashboard
      const summaryText = [
        resumeData.personalInfo?.fullName,
        resumeData.personalInfo?.headline,
        resumeData.professionalSummary,
        ...(resumeData.experience || []).map((e: any) => `${e.company} - ${e.position}: ${(e.description || []).join(" ")}`),
        ...(resumeData.education || []).map((ed: any) => `${ed.institution} - ${ed.degree}`),
        ...(resumeData.skills?.languages || []),
        ...(resumeData.skills?.frameworks || []),
        ...(resumeData.skills?.tools || []),
      ].filter(Boolean).join("\n\n");

      await attachResumeMeta(userId, {
        id: resumeId,
        fileName: `${resumeName}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: Buffer.byteLength(summaryText, "utf-8"),
        extractedText: summaryText,
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      resumeId,
      message: "Resume saved to your CareerVerse account!",
    });
  } catch (error: any) {
    console.error("Save resume error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save resume." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ resume: null });
    }

    if (hasFirebaseAdminCredentials()) {
      const db = getAdminDb();
      const snap = await db
        .collection(USERS_COLLECTION)
        .doc(session.user.id)
        .collection("builderResumes")
        .orderBy("updatedAt", "desc")
        .limit(1)
        .get();

      if (!snap.empty) {
        const docData = snap.docs[0].data();
        return NextResponse.json({
          resume: docData.data,
          templateId: docData.templateId || "classic",
          title: docData.name,
          updatedAt: docData.updatedAt,
        });
      }
    }

    return NextResponse.json({
      resume: null,
      userProfile: {
        name: session.user.name || "",
        email: session.user.email || "",
      },
    });
  } catch (error: any) {
    console.error("Fetch saved resume error:", error);
    return NextResponse.json({ resume: null });
  }
}
