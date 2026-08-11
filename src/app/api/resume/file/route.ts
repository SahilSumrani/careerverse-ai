import { readFile } from "fs/promises";
import { getUserById, type ResumeMeta } from "@/lib/firestore-users";
import { jsonError, jsonOk, requireSession } from "@/lib/api";
import {
  hasFirebaseAdminCredentials,
  getAdminStorage,
  resolveStorageBucket,
} from "@/lib/firebase-admin";
import {
  isBrokenResumeStorageUrl,
  isFirebaseResumeObjectPath,
  isLocalTmpStoragePath,
  localResumeFileExists,
} from "@/lib/uploads";

async function refreshSignedUrl(resume: ResumeMeta): Promise<string | null> {
  // Never trust HTTP URLs that embed /tmp object paths (legacy NoSuchBucket links)
  if (
    resume.storageUrl &&
    resume.storageUrl.startsWith("http") &&
    !isBrokenResumeStorageUrl(resume.storageUrl)
  ) {
    return resume.storageUrl;
  }

  if (!resume.storagePath) return null;

  // Local /tmp fallback — never mint Storage signed URLs for filesystem paths
  if (isLocalTmpStoragePath(resume.storagePath)) {
    return null;
  }

  if (!isFirebaseResumeObjectPath(resume.storagePath)) return null;
  if (!hasFirebaseAdminCredentials()) return null;

  const bucketName = resolveStorageBucket();
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

function findResume(user: Awaited<ReturnType<typeof getUserById>>, id: string | null) {
  if (!user) return null;
  const resumes = user.resumes?.length ? user.resumes : user.resume ? [user.resume] : [];
  return id ? resumes.find((r) => r.id === id) ?? null : resumes[0] ?? null;
}

/** Serve a locally stored resume (authenticated). */
async function streamLocalResume(resume: ResumeMeta) {
  if (!resume.storagePath || !isLocalTmpStoragePath(resume.storagePath)) {
    return jsonError("Resume file not available", 404);
  }
  if (!(await localResumeFileExists(resume.storagePath))) {
    return jsonError(
      "This resume was stored ephemerally and is no longer on this server. Please re-upload.",
      410,
    );
  }

  const buf = await readFile(resume.storagePath);
  return new Response(buf, {
    headers: {
      "Content-Type": resume.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(resume.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/**
 * Signed/download URL for a user's stored resume.
 * ?stream=1 — serve bytes when the file lives under local /tmp (never Storage).
 */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const wantStream = url.searchParams.get("stream") === "1";

    const user = await getUserById(session.user.id);
    if (!user) return jsonError("User not found", 404);

    const resume = findResume(user, id);
    if (!resume) return jsonError("Resume not found", 404);

    if (wantStream) {
      return streamLocalResume(resume);
    }

    // Prefer Storage signed URL only for real object keys under resumes/
    const signed = await refreshSignedUrl(resume);
    if (signed) {
      return jsonOk({
        id: resume.id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        url: signed,
        backend: "firebase",
        unavailable: false,
        extractedText: resume.extractedText ?? null,
      });
    }

    // Local /tmp: expose authenticated stream URL (not a Storage link)
    if (resume.storagePath && isLocalTmpStoragePath(resume.storagePath)) {
      const exists = await localResumeFileExists(resume.storagePath);
      if (exists) {
        const streamUrl = `/api/resume/file?id=${encodeURIComponent(resume.id)}&stream=1`;
        return jsonOk({
          id: resume.id,
          fileName: resume.fileName,
          mimeType: resume.mimeType,
          url: streamUrl,
          backend: "tmp",
          unavailable: false,
          extractedText: resume.extractedText ?? null,
        });
      }
      return jsonOk({
        id: resume.id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        url: null,
        backend: "tmp",
        unavailable: true,
        reason:
          "This resume was saved under a temporary local path and is no longer available. Please re-upload.",
        extractedText: resume.extractedText ?? null,
      });
    }

    // Broken legacy Storage URL (/tmp object path) or missing file
    if (isBrokenResumeStorageUrl(resume.storageUrl) || isLocalTmpStoragePath(resume.storagePath)) {
      return jsonOk({
        id: resume.id,
        fileName: resume.fileName,
        mimeType: resume.mimeType,
        url: null,
        backend: "broken",
        unavailable: true,
        reason:
          "This resume link points at an invalid Storage path. Please re-upload to Firebase Storage.",
        extractedText: resume.extractedText ?? null,
      });
    }

    return jsonOk({
      id: resume.id,
      fileName: resume.fileName,
      mimeType: resume.mimeType,
      url: null,
      backend: "none",
      unavailable: true,
      reason: "No downloadable file is available for this resume. Please re-upload.",
      extractedText: resume.extractedText ?? null,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 401) return jsonError("Unauthorized", 401);
    return jsonError("Unable to load resume file", 500);
  }
}
