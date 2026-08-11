"use client";

import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import type { ExperienceEntry } from "@/lib/experiences";
import { formatExperiencePeriod } from "@/lib/experiences";

export type ResumeExportProfile = {
  name: string;
  email?: string | null;
  headline?: string | null;
  education?: string | null;
  degree?: string | null;
  college?: string | null;
  graduationYear?: number | null;
  careerGoals?: string | null;
  experienceSummary?: string | null;
  experiences?: ExperienceEntry[];
  skills: string[];
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
};

function contactLine(p: ResumeExportProfile) {
  return [p.email, p.linkedinUrl, p.githubUrl, p.portfolioUrl].filter(Boolean).join(" | ");
}

function educationLine(p: ResumeExportProfile) {
  const parts = [
    p.degree,
    p.college || p.education,
    p.graduationYear ? String(p.graduationYear) : null,
  ].filter(Boolean);
  return parts.join(" · ") || null;
}

function experienceBlocks(p: ResumeExportProfile): Array<{ head: string; body: string }> {
  if (p.experiences?.length) {
    return p.experiences
      .filter((e) => e.company)
      .map((e) => ({
        head: [e.company, formatExperiencePeriod(e.start, e.end)].filter(Boolean).join(" — "),
        body: e.responsibilities || "",
      }));
  }
  if (p.experienceSummary?.trim()) {
    return [{ head: "Experience", body: p.experienceSummary.trim() }];
  }
  return [];
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Simple single-column ATS-friendly PDF (no tables/graphics). */
export function downloadResumePdf(profile: ResumeExportProfile) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const maxWidth = 612 - margin * 2;
  let y = margin;
  const name = profile.name || "CareerVerse Candidate";

  const write = (text: string, opts?: { size?: number; bold?: boolean; gap?: number }) => {
    const size = opts?.size ?? 11;
    doc.setFont("helvetica", opts?.bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      if (y > 740) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += size + 4;
    }
    y += opts?.gap ?? 6;
  };

  write(name, { size: 18, bold: true, gap: 4 });
  const contact = contactLine(profile);
  if (contact) write(contact, { size: 10, gap: 10 });
  if (profile.headline) write(profile.headline, { size: 11, gap: 12 });

  write("SUMMARY / GOALS", { size: 12, bold: true, gap: 4 });
  write(profile.careerGoals || "Seeking roles aligned with my skills and interests.", { gap: 12 });

  const edu = educationLine(profile);
  if (edu) {
    write("EDUCATION", { size: 12, bold: true, gap: 4 });
    write(edu, { gap: 12 });
  }

  const exps = experienceBlocks(profile);
  if (exps.length) {
    write("EXPERIENCE", { size: 12, bold: true, gap: 4 });
    for (const block of exps) {
      write(block.head, { bold: true, gap: 2 });
      if (block.body) write(block.body, { gap: 10 });
    }
  }

  if (profile.skills.length) {
    write("SKILLS", { size: 12, bold: true, gap: 4 });
    write(profile.skills.join(", "), { gap: 8 });
  }

  const safe = name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  doc.save(`${safe}_resume.pdf`);
}

/** Simple ATS-friendly DOCX (paragraphs only). */
export async function downloadResumeDocx(profile: ResumeExportProfile) {
  const name = profile.name || "CareerVerse Candidate";
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: name, bold: true })],
    }),
  ];

  const contact = contactLine(profile);
  if (contact) {
    children.push(new Paragraph({ children: [new TextRun({ text: contact, size: 20 })] }));
  }
  if (profile.headline) {
    children.push(new Paragraph({ children: [new TextRun({ text: profile.headline, italics: true })] }));
  }

  children.push(new Paragraph({ children: [] }));
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: "SUMMARY / GOALS", bold: true })],
    }),
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: profile.careerGoals || "Seeking roles aligned with my skills and interests.",
        }),
      ],
    }),
  );

  const edu = educationLine(profile);
  if (edu) {
    children.push(new Paragraph({ children: [] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "EDUCATION", bold: true })],
      }),
    );
    children.push(new Paragraph({ children: [new TextRun({ text: edu })] }));
  }

  const exps = experienceBlocks(profile);
  if (exps.length) {
    children.push(new Paragraph({ children: [] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "EXPERIENCE", bold: true })],
      }),
    );
    for (const block of exps) {
      children.push(new Paragraph({ children: [new TextRun({ text: block.head, bold: true })] }));
      if (block.body) {
        for (const line of block.body.split("\n").filter(Boolean)) {
          children.push(new Paragraph({ children: [new TextRun({ text: line })] }));
        }
      }
    }
  }

  if (profile.skills.length) {
    children.push(new Paragraph({ children: [] }));
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: "SKILLS", bold: true })],
      }),
    );
    children.push(new Paragraph({ children: [new TextRun({ text: profile.skills.join(", ") })] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });
  const blob = await Packer.toBlob(doc);
  const safe = name.replace(/[^\w\-]+/g, "_").slice(0, 40);
  downloadBlob(blob, `${safe}_resume.docx`);
}
