import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Map([
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

function isServerlessReadonlyFs() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT ||
      process.cwd() === "/var/task",
  );
}

/** Writable upload root — never mkdir under /var/task on Vercel. */
export function resolveUploadDir(): string {
  if (process.env.UPLOAD_DIR) {
    return process.env.UPLOAD_DIR.startsWith("/")
      ? process.env.UPLOAD_DIR
      : isServerlessReadonlyFs()
        ? path.join("/tmp", process.env.UPLOAD_DIR)
        : path.join(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR);
  }
  if (isServerlessReadonlyFs()) {
    return path.join("/tmp", "careerverse-uploads");
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "uploads");
}

export type ValidatedResume = {
  buffer: Buffer;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
  ext: string;
};

/** Validate mime/magic bytes and return in-memory bytes — no filesystem write. */
export async function validateAndReadResume(file: File): Promise<ValidatedResume> {
  const max = Number(process.env.MAX_UPLOAD_BYTES || 5_242_880);
  if (file.size > max) {
    throw Object.assign(new Error("File too large. Max 5MB."), { status: 400 });
  }
  const extFromMime = ALLOWED.get(file.type);
  const lowerName = file.name.toLowerCase();
  const extFromName = lowerName.endsWith(".pdf") ? ".pdf" : lowerName.endsWith(".docx") ? ".docx" : null;
  if (!extFromMime || !extFromName || extFromMime !== extFromName) {
    throw Object.assign(new Error("Only PDF and DOCX resumes are allowed."), { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (extFromName === ".pdf" && buffer.subarray(0, 4).toString() !== "%PDF") {
    throw Object.assign(new Error("Invalid PDF file."), { status: 400 });
  }
  if (extFromName === ".docx" && buffer.subarray(0, 2).toString("binary") !== "PK") {
    throw Object.assign(new Error("Invalid DOCX file."), { status: 400 });
  }

  return {
    buffer,
    mimeType: file.type,
    sizeBytes: file.size,
    fileName: file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 180),
    ext: extFromName,
  };
}

/**
 * Ephemeral local fallback when Firebase Storage is unavailable.
 * On Vercel this writes under /tmp only — never under process.cwd()/uploads.
 */
export async function writeResumeToTmp(
  buffer: Buffer,
  fileName: string,
  ext: string,
): Promise<{ storagePath: string }> {
  const uploadDir = resolveUploadDir();
  await mkdir(uploadDir, { recursive: true });
  const storageName = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
  const storagePath = path.join(/* turbopackIgnore: true */ uploadDir, storageName);
  await writeFile(storagePath, buffer);
  return { storagePath };
}

/** @deprecated Prefer validateAndReadResume + Storage / writeResumeToTmp */
export async function saveResumeFile(file: File) {
  const validated = await validateAndReadResume(file);
  const { storagePath } = await writeResumeToTmp(validated.buffer, validated.fileName, validated.ext);
  return {
    storagePath,
    mimeType: validated.mimeType,
    sizeBytes: validated.sizeBytes,
    fileName: validated.fileName,
    buffer: validated.buffer,
  };
}

export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    try {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse =
        (pdfParseModule as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default ||
        (pdfParseModule as unknown as (b: Buffer) => Promise<{ text: string }>);
      const result = await pdfParse(buffer);
      return (result.text || "").slice(0, 50000);
    } catch {
      return "";
    }
  }
  if (mimeType.includes("wordprocessingml")) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return (result.value || "").slice(0, 50000);
    } catch {
      return "";
    }
  }
  return "";
}
