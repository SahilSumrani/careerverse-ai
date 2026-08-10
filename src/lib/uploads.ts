import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Map([
  ["application/pdf", ".pdf"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

export async function saveResumeFile(file: File) {
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
  // Light magic-byte checks
  if (extFromName === ".pdf" && buffer.subarray(0, 4).toString() !== "%PDF") {
    throw Object.assign(new Error("Invalid PDF file."), { status: 400 });
  }
  if (extFromName === ".docx" && buffer.subarray(0, 2).toString("binary") !== "PK") {
    throw Object.assign(new Error("Invalid DOCX file."), { status: 400 });
  }

  const uploadRoot = process.env.UPLOAD_DIR || "uploads";
  const uploadDir = path.join(/* turbopackIgnore: true */ process.cwd(), uploadRoot);
  await mkdir(uploadDir, { recursive: true });
  const storageName = `${Date.now()}-${randomBytes(8).toString("hex")}${extFromName}`;
  const storagePath = path.join(/* turbopackIgnore: true */ uploadDir, storageName);
  await writeFile(storagePath, buffer);
  return {
    storagePath,
    mimeType: file.type,
    sizeBytes: file.size,
    fileName: file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 180),
    buffer,
  };
}

export async function extractResumeText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    try {
      // pdf-parse v1 CommonJS default export
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default
        || (pdfParseModule as unknown as (b: Buffer) => Promise<{ text: string }>);
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
