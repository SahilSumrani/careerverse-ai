import { getUserById, type ResumeMeta } from "@/lib/firestore-users";
import { jsonError, jsonOk, requireSession } from "@/lib/api";
import { hasFirebaseAdminCredentials, getAdminStorage } from "@/lib/firebase-admin";

async function refreshSignedUrl(resume: ResumeMeta): Promise<string | null> {
  if (resume.storageUrl && resume.storageUrl.startsWith("http")) return resume.storageUrl;
  if (!resume.storagePath || !hasFirebaseAdminCredentials()) return null;
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) return null;
  try {
    const file = getAdminStorage().bucket(bucketName).file(resume.storagePath);
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24,
    });
    return url;
  } catch {
    return null;
  }
}

/** Signed/download URL for a user's stored resume. */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const id = new URL(req.url).searchParams.get("id");
    const user = await getUserById(session.user.id);
    if (!user) return jsonError("User not found", 404);

    const resumes = user.resumes?.length ? user.resumes : user.resume ? [user.resume] : [];
    const resume = id ? resumes.find((r) => r.id === id) : resumes[0];
    if (!resume) return jsonError("Resume not found", 404);

    const url = await refreshSignedUrl(resume);
    return jsonOk({
      id: resume.id,
      fileName: resume.fileName,
      mimeType: resume.mimeType,
      url,
      extractedText: resume.extractedText ?? null,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load resume file", 500);
  }
}
