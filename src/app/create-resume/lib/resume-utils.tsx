import { ReactNode } from "react";
import { ResumeData } from "../types/resume";

// Strict emoji cleaner
export function stripEmojis(text: string | undefined | null): string {
  if (!text) return "";
  return text
    .replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripEmojisFromObject(obj: any): any {
  if (typeof obj === "string") return stripEmojis(obj);
  if (Array.isArray(obj)) return obj.map(stripEmojisFromObject);
  if (obj && typeof obj === "object") {
    const res: any = {};
    for (const [k, v] of Object.entries(obj)) {
      res[k] = stripEmojisFromObject(v);
    }
    return res;
  }
  return obj;
}

// Clean markdown bold (**) and asterisks (*) into React elements without emojis
export function renderFormattedText(text: string | undefined): ReactNode {
  if (!text) return null;
  const clean = stripEmojis(text);
  const parts = clean.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2).replace(/\*/g, "").trim();
      return (
        <strong key={index} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    }
    const cleaned = part.replace(/\*/g, "");
    return <span key={index}>{cleaned}</span>;
  });
}

// Starter blank template tailored to session user
export function getStarterResume(user?: { name?: string | null; email?: string | null } | null): ResumeData {
  return {
    templateId: "classic",
    personalInfo: {
      fullName: user?.name || "",
      headline: "",
      email: user?.email || "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },
    professionalSummary: "",
    experience: [],
    projects: [],
    education: [],
    skills: {
      languages: [],
      frameworks: [],
      tools: [],
    },
    keyAchievements: [],
    trainingCourses: [],
    languages: [],
  };
}

// Proactive real-time suggestions: only recommends what is missing/weak
export function getResumeSuggestions(data: ResumeData): string[] {
  const suggestions: string[] = [];

  if (!data.personalInfo?.headline?.trim()) {
    suggestions.push("Add a targeted job title headline (e.g., 'Full Stack Developer | React & Node.js').");
  }

  const summary = data.professionalSummary?.trim() || "";
  if (!summary || summary.length < 50) {
    suggestions.push("Add a 2-3 sentence professional summary focusing on your technical strengths.");
  }

  const hasExp = (data.experience || []).length > 0;
  const hasProj = (data.projects || []).length > 0;
  if (!hasExp && !hasProj) {
    suggestions.push("Add at least 1 internship, work experience, or key project.");
  } else if (hasExp) {
    const lacksMetrics = data.experience.some((e) =>
      (e.description || []).some((b) => !/\d+|%|\$|scaled|optimized|built|increased|reduced/i.test(b))
    );
    if (lacksMetrics) {
      suggestions.push("Quantify experience bullets with measurable metrics (% increase, numbers, scale).");
    }
  }

  const totalSkills =
    (data.skills?.languages?.length || 0) +
    (data.skills?.frameworks?.length || 0) +
    (data.skills?.tools?.length || 0);
  if (totalSkills < 4) {
    suggestions.push("Add key technical skills across languages, frameworks, and tools.");
  }

  if (!data.education || data.education.length === 0) {
    suggestions.push("Add your degree and university under the Education section.");
  }

  return suggestions;
}

// Sample fallback content with generic data
export const SAMPLE_DATA: ResumeData = {
  templateId: "classic",
  personalInfo: {
    fullName: "Alex Morgan",
    headline: "Full Stack Developer | Modern Web Technologies",
    email: "alex.morgan@example.com",
    phone: "+1 (555) 019-2834",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/alex-morgan",
    github: "github.com/alexmorgan",
  },
  professionalSummary:
    "Passionate web developer proficient in JavaScript, React, and Node.js, building responsive full-stack applications that boost user engagement by up to 30%; seeking an internship to deliver scalable solutions and deepen expertise in modern web technologies.",
  experience: [
    {
      company: "TechNova Solutions",
      position: "Frontend Development Intern",
      startDate: "06/2023",
      endDate: "Present",
      current: true,
      location: "San Francisco, CA",
      description: [
        "Collaborated with cross-functional teams to outline UI requirements, resulting in a successful launch of digital campaign assets.",
        "Created accessible visual layouts and brand identity guidelines for high-visibility public portals.",
      ],
    },
  ],
  projects: [
    {
      name: "CareerVerse AI Platform",
      technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
      link: "https://careerverse.ai",
      description: [
        "Engineered an interactive resume builder with real-time A4 preview and dual executive templates.",
        "Integrated AI voice assistant utilizing Groq LLM inference for sub-second ATS resume optimization.",
      ],
    },
  ],
  education: [
    {
      institution: "State University of California",
      degree: "Bachelor of Science in Computer Science",
      startDate: "2022",
      endDate: "2026",
      location: "San Francisco, CA",
      score: "3.8 GPA",
    },
  ],
  skills: {
    languages: ["JavaScript", "TypeScript", "HTML", "CSS", "PHP"],
    frameworks: ["React.js", "Next.js", "Tailwind CSS", "Node.js"],
    tools: ["MongoDB", "Git", "Figma", "WordPress", "Shopify"],
  },
  keyAchievements: [
    {
      title: "Revamped Customer Feedback System",
      description:
        "Introduced an innovative feedback system that enhanced response rates by 50%, leading to actionable insights that drove initiatives to improve satisfaction.",
    },
    {
      title: "Increased User Retention",
      description:
        "Successfully designed a user loyalty program that increased engagement by 20%, significantly improving overall retention.",
    },
    {
      title: "Elevated Service Quality",
      description:
        "Implemented training curriculum that increased customer service quality ratings by 30% within six months.",
    },
  ],
  trainingCourses: [
    {
      name: "Full Stack Web Development",
      issuer: "Coursera",
      durationYears: "0.5",
      year: "2023",
    },
    {
      name: "Data-Driven Decisions & Analytics",
      issuer: "edX",
      durationYears: "0.2",
      year: "2023",
    },
  ],
  languages: ["English", "Hindi"],
};
