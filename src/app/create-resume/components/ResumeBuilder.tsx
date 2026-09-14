"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect, useRef, ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Plus,
  Trash2,
  Download,
  Mic,
  MicOff,
  Sparkles,
  Save,
  Check,
  Layout,
  LogIn,
  FileType,
  Volume2,
  X,
  ExternalLink,
} from "lucide-react";

export interface ResumeData {
  templateId?: "executive" | "classic";
  personalInfo: {
    fullName: string;
    headline?: string;
    email: string;
    phone: string;
    location?: string;
    linkedin: string;
    github: string;
  };
  professionalSummary?: string;
  education: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    score: string;
    location?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    location?: string;
    description: string[];
  }>;
  projects: Array<{
    name: string;
    technologies: string[];
    link?: string;
    description: string[];
  }>;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  keyAchievements?: Array<{
    title: string;
    description: string;
  }>;
  trainingCourses?: Array<{
    name: string;
    provider?: string;
    duration?: string;
    description: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

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
function renderFormattedText(text: string | undefined): ReactNode {
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

// Sample fallback content
const SAMPLE_DATA: ResumeData = {
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
      provider: "Coursera",
      duration: "6 Months",
      description:
        "Comprehensive program focused on modern frontend architecture, REST APIs, and database design.",
    },
    {
      name: "Data-Driven Decisions & Analytics",
      provider: "edX",
      duration: "8 Weeks",
      description:
        "Course focused on making informed strategic decisions based on application metrics and user analytics.",
    },
  ],
  languages: [
    { name: "English", proficiency: 5 },
  ],
};

// Tag editor for skills
function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder: string;
}) {
  const [inputVal, setInputVal] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-2 p-2 border border-slate-300 rounded-lg bg-white min-h-[44px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-medium rounded-md border border-slate-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputVal)}
          placeholder={tags.length === 0 ? placeholder : "Add more..."}
          className="flex-1 min-w-[120px] text-xs outline-none bg-transparent"
        />
      </div>
      <p className="text-[11px] text-slate-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

export function ResumeBuilder({
  initialData,
  onBack,
}: {
  initialData?: ResumeData | null;
  onBack: () => void;
}) {
  const { data: session } = useSession();
  const storageKey = session?.user?.id ? `cv_resume_draft_${session.user.id}` : "cv_resume_draft_guest";

  const [activeTab, setActiveTab] = useState<
    "personal" | "summary" | "experience" | "projects" | "education" | "skills" | "achievements" | "courses"
  >("personal");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [showAssistantBubble, setShowAssistantBubble] = useState(true);
  const [aiMessage, setAiMessage] = useState<string>(
    "Hello! I am your AI Resume Assistant. I monitor your sections in real time to suggest high-impact improvements."
  );
  const [zoom, setZoom] = useState<number>(75);
  const [resumeFontSize, setResumeFontSize] = useState<"compact" | "standard" | "large">("standard");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
  const [autoSpeak, setAutoSpeak] = useState(true);

  const previewRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const starter = getStarterResume(session?.user);
  const initialValues: ResumeData = {
    ...starter,
    ...(initialData || {}),
    personalInfo: {
      ...starter.personalInfo,
      ...(initialData?.personalInfo || {}),
    },
    skills: {
      languages: initialData?.skills?.languages || [],
      frameworks: initialData?.skills?.frameworks || [],
      tools: initialData?.skills?.tools || [],
    },
    projects: initialData?.projects || [],
    education: initialData?.education || [],
    experience: initialData?.experience || [],
    templateId: initialData?.templateId || "classic",
  };

  const { register, control, watch, reset, getValues, setValue } = useForm<ResumeData>({
    defaultValues: initialValues,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: "projects" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: achFields, append: appendAch, remove: removeAch } = useFieldArray({
    control,
    name: "keyAchievements" as any,
  });
  const { fields: courseFields, append: appendCourse, remove: removeCourse } = useFieldArray({
    control,
    name: "trainingCourses" as any,
  });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({
    control,
    name: "languages" as any,
  });

  const isInitialized = useRef(false);

  // Auto-fit zoom on phone screens
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      const calcZoom = Math.max(38, Math.floor(((window.innerWidth - 24) / 794) * 100));
      setZoom(calcZoom);
    }
  }, []);

  // Sync across devices: fetch user's saved resume from cloud if signed in
  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    fetch("/api/resume/save")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        if (data?.resume && !initialData) {
          reset(stripEmojisFromObject(data.resume));
          if (data.templateId) setValue("templateId", data.templateId);
          isInitialized.current = true;
        } else if (!initialData && data?.userProfile) {
          const curr = getValues();
          if (!curr.personalInfo.fullName && data.userProfile.name) {
            setValue("personalInfo.fullName", stripEmojis(data.userProfile.name));
          }
          if (!curr.personalInfo.email && data.userProfile.email) {
            setValue("personalInfo.email", stripEmojis(data.userProfile.email));
          }
        }
      })
      .catch((err) => console.warn("Failed to load server resume", err));
    return () => {
      active = false;
    };
  }, [session?.user?.id, initialData, reset, setValue, getValues]);

  // Load from session-specific local draft
  useEffect(() => {
    if (initialData && !isInitialized.current) {
      reset(stripEmojisFromObject(initialData));
      isInitialized.current = true;
    } else if (!isInitialized.current) {
      const draft = localStorage.getItem(storageKey);
      if (draft) {
        try {
          reset(stripEmojisFromObject(JSON.parse(draft)));
          isInitialized.current = true;
        } catch (e) {
          console.error("Failed to parse resume draft", e);
        }
      }
    }
  }, [initialData, storageKey, reset]);

  const formData = watch();
  const currentTemplate = formData.templateId || "classic";
  const liveSuggestions = getResumeSuggestions(formData);

  // Auto-save draft to session-scoped localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(handler);
  }, [formData, storageKey]);

  // Instant speech synthesis: English only, zero network latency
  const speakResponse = (text: string) => {
    const cleanText = stripEmojis(text);
    if (!cleanText || typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Aria") || v.name.includes("Samantha"))
        ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn("Speech synthesis error:", synthErr);
      }
    }
  };

  // Run AI Assistant optimization command (supports voice or text)
  const runAssistantCommand = async (command: string) => {
    const cleanCmd = stripEmojis(command);
    if (!cleanCmd) return;
    setIsProcessingVoice(true);
    setAiMessage(`Working on: "${cleanCmd}"...`);
    setShowAssistantBubble(true);

    try {
      const currentValues = getValues();
      const res = await fetch("/api/resume/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: cleanCmd,
          resumeState: currentValues,
        }),
      });

      if (!res.ok) throw new Error("Assistant request failed");
      const responseData = await res.json();
      const { updatedResume, aiResponse } = responseData?.data || {};

      if (updatedResume) {
        const sanitized = stripEmojisFromObject(updatedResume);
        reset({
          ...currentValues,
          ...sanitized,
          personalInfo: { ...currentValues.personalInfo, ...(sanitized.personalInfo || {}) },
          skills: { ...currentValues.skills, ...(sanitized.skills || {}) },
        });
      }

      const reply = stripEmojis(aiResponse) || "I have updated your resume with your requested changes.";
      setAiMessage(reply);
      if (autoSpeak) {
        speakResponse(reply);
      }
    } catch (err: any) {
      console.error("AI assistant error:", err);
      const errMsg = "Could not complete request. Please try again.";
      setAiMessage(errMsg);
      if (autoSpeak) speakResponse(errMsg);
    } finally {
      setIsProcessingVoice(false);
    }
  };

  // English-only Voice Recognition
  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setIsProcessingVoice(false);
      setAiMessage("Voice Assistant paused.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiMessage("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessingVoice(false);
        setShowAssistantBubble(true);
        setAiMessage("Listening... Speak your resume request or tap a suggestion below.");
      };

      recognition.onresult = async (event: any) => {
        const result = event.results?.[0]?.[0];
        const rawTranscript = result?.transcript?.trim();
        const confidence = typeof result?.confidence === "number" ? result.confidence : 1;

        // Filter out ambient noise, coughs, single-syllable background sounds
        if (!rawTranscript || rawTranscript.length < 3 || confidence < 0.25) {
          setIsListening(false);
          setAiMessage("Could not hear clearly. Please tap the mic to speak again or click a suggestion below.");
          return;
        }

        setIsListening(false);
        await runAssistantCommand(rawTranscript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setIsProcessingVoice(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      setIsProcessingVoice(false);
    }
  };

  // Save to account
  const handleSaveToAccount = async () => {
    if (!session?.user) {
      setShowSignInPrompt(true);
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: getValues(),
          templateId: currentTemplate,
          title: `${getValues().personalInfo.fullName || "My"} Resume`,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save");
      setSaveStatus("Saved to your account!");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save resume.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF
  const exportPDF = () => {
    setIsExporting(true);
    const handleAfterPrint = () => {
      setIsExporting(false);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    window.addEventListener("afterprint", handleAfterPrint);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-100 print:h-auto print:overflow-visible print:block">
      {/* Mobile Top View Switcher (Edit vs Preview) */}
      <div className="flex md:hidden items-center justify-between p-2 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-2xs">
        <button
          onClick={onBack}
          className="text-slate-600 text-xs font-semibold px-2 py-1 flex items-center gap-1 cursor-pointer"
        >
          &larr; Back
        </button>
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mobileTab === "edit"
                ? "bg-white text-blue-600 shadow-xs font-bold"
                : "text-slate-600"
            }`}
          >
            Edit Form
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileTab("preview");
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setZoom(Math.max(38, Math.floor(((window.innerWidth - 24) / 794) * 100)));
              }
            }}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mobileTab === "preview"
                ? "bg-white text-blue-600 shadow-xs font-bold"
                : "text-slate-600"
            }`}
          >
            Preview PDF
          </button>
        </div>
        <button
          type="button"
          onClick={exportPDF}
          disabled={isExporting}
          className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <Download size={12} /> PDF
        </button>
      </div>

      {/* LEFT: Editor */}
      <div className={`w-full md:w-[45%] lg:w-[42%] h-full flex flex-col border-r border-slate-200 bg-white print:hidden shrink-0 shadow-sm ${mobileTab === "edit" ? "flex" : "hidden md:flex"}`}>
        {/* Top bar with back, template switcher, and save/export buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            &larr; Back
          </button>

          {/* Template Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setValue("templateId", "executive")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentTemplate === "executive"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layout size={13} />
              Executive (2-Col)
            </button>
            <button
              onClick={() => setValue("templateId", "classic")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                currentTemplate === "classic"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileType size={13} />
              Classic (1-Col)
            </button>
          </div>

          {/* Actions: Demo, Save & PDF Export */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Load sample demo data? This will fill the fields with an example.")) {
                  reset(stripEmojisFromObject(SAMPLE_DATA));
                }
              }}
              title="Load example data for demo"
              className="px-2 py-1 text-[11px] text-slate-500 hover:text-blue-600 font-medium rounded hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Demo Example
            </button>
            <button
              onClick={handleSaveToAccount}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                session?.user
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-slate-800 text-white hover:bg-slate-900"
              }`}
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveStatus ? (
                <Check size={14} className="text-emerald-300" />
              ) : session?.user ? (
                <Save size={14} />
              ) : (
                <LogIn size={14} />
              )}
              <span>{saveStatus || (session?.user ? "Save" : "Sign In to Save")}</span>
            </button>

            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-white">
          {[
            { id: "personal", label: "Personal" },
            { id: "summary", label: "Summary" },
            { id: "experience", label: "Experience" },
            { id: "projects", label: "Projects" },
            { id: "education", label: "Education" },
            { id: "skills", label: "Skills" },
            { id: "achievements", label: "Achievements" },
            { id: "courses", label: "Courses & Languages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/40"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "personal" && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  {...register("personalInfo.fullName")}
                  placeholder="e.g. Alex Morgan"
                  className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline / Role Title
                </label>
                <input
                  {...register("personalInfo.headline")}
                  placeholder="e.g. Full Stack Developer | Web Technologies"
                  className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    {...register("personalInfo.email")}
                    className="w-full p-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    {...register("personalInfo.phone")}
                    className="w-full p-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    {...register("personalInfo.location")}
                    placeholder="e.g. Delhi, India"
                    className="w-full p-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    {...register("personalInfo.linkedin")}
                    placeholder="linkedin.com/in/username"
                    className="w-full p-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  {...register("professionalSummary")}
                  rows={6}
                  placeholder="Passionate web developer proficient in..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4 animate-in fade-in">
              {expFields.map((field, index) => (
                <div key={field.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeExp(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Company</label>
                        <input
                          {...register(`experience.${index}.company`)}
                          placeholder="Company name"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Position</label>
                        <input
                          {...register(`experience.${index}.position`)}
                          placeholder="Job Title"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Start Date</label>
                        <input
                          {...register(`experience.${index}.startDate`)}
                          placeholder="06/2023"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">End Date</label>
                        <input
                          {...register(`experience.${index}.endDate`)}
                          placeholder="Present"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Location</label>
                        <input
                          {...register(`experience.${index}.location`)}
                          placeholder="Delhi, India"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">
                        Bullet Points (one per line)
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={(formData.experience?.[index]?.description || []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0);
                          setValue(`experience.${index}.description`, lines);
                        }}
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  appendExp({
                    company: "",
                    position: "",
                    startDate: "",
                    endDate: "",
                    location: "",
                    description: [],
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} /> Add Experience
              </button>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-4 animate-in fade-in">
              {projFields.map((field, index) => (
                <div key={field.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeProj(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-2.5 pr-6">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Project Name</label>
                        <input
                          {...register(`projects.${index}.name`)}
                          placeholder="e.g. CareerVerse Platform"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Project Link (optional)</label>
                        <input
                          {...register(`projects.${index}.link`)}
                          placeholder="e.g. https://github.com/..."
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <Controller
                        control={control}
                        name={`projects.${index}.technologies`}
                        render={({ field }) => (
                          <TagInput
                            label="Technologies Used"
                            tags={field.value || []}
                            onChange={field.onChange}
                            placeholder="e.g. React, Next.js, Node.js"
                          />
                        )}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">
                        Bullet Points / Key Features
                      </label>
                      <textarea
                        rows={3}
                        defaultValue={(formData.projects?.[index]?.description || []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0);
                          setValue(`projects.${index}.description`, lines);
                        }}
                        placeholder="• Built responsive UI&#10;• Reduced latency by 35%"
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  appendProj({
                    name: "",
                    technologies: [],
                    link: "",
                    description: [],
                  })
                }
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} /> Add Project
              </button>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4 animate-in fade-in">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeEdu(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid gap-2.5 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Institution</label>
                      <input
                        {...register(`education.${index}.institution`)}
                        placeholder="University / College"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Degree / Course</label>
                      <input
                        {...register(`education.${index}.degree`)}
                        placeholder="Bachelor of Computer Applications"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Start Date</label>
                        <input
                          {...register(`education.${index}.startDate`)}
                          placeholder="2023"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">End Date</label>
                        <input
                          {...register(`education.${index}.endDate`)}
                          placeholder="2026"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  appendEdu({ institution: "", degree: "", startDate: "", endDate: "", score: "", location: "" })
                }
                className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} /> Add Education
              </button>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-4 animate-in fade-in">
              <Controller
                control={control}
                name="skills.languages"
                render={({ field }) => (
                  <TagInput
                    label="Programming & Web Technologies"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. JavaScript, PHP, HTML, CSS, TypeScript"
                  />
                )}
              />

              <Controller
                control={control}
                name="skills.frameworks"
                render={({ field }) => (
                  <TagInput
                    label="Frameworks & Libraries"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. React.js, Next.js, Tailwind CSS"
                  />
                )}
              />

              <Controller
                control={control}
                name="skills.tools"
                render={({ field }) => (
                  <TagInput
                    label="Platforms & Tools"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. MongoDB, Git, Figma, Shopify"
                  />
                )}
              />
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-3.5 animate-in fade-in">
              {achFields.map((field, index) => (
                <div key={field.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeAch(index)}
                    className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                  <div className="space-y-2 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Title</label>
                      <input
                        {...register(`keyAchievements.${index}.title` as any)}
                        placeholder="Achievement Title"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Description</label>
                      <textarea
                        rows={2}
                        {...register(`keyAchievements.${index}.description` as any)}
                        placeholder="Describe the impact or outcome..."
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendAch({ title: "", description: "" })}
                className="w-full flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} /> Add Achievement
              </button>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Training / Courses</h3>
                <div className="space-y-2.5">
                  {courseFields.map((field, index) => (
                    <div key={field.id} className="p-2.5 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                      <button
                        type="button"
                        onClick={() => removeCourse(index)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="space-y-1.5 pr-5">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register(`trainingCourses.${index}.name` as any)}
                            placeholder="Course name"
                            className="w-full p-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                          />
                          <input
                            {...register(`trainingCourses.${index}.duration` as any)}
                            placeholder="Duration / Year (e.g. 6 Months, 2024)"
                            className="w-full p-1 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <input
                          {...register(`trainingCourses.${index}.description` as any)}
                          placeholder="Provider & skills learned"
                          className="w-full p-1 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendCourse({ name: "", provider: "", duration: "", description: "" })}
                    className="w-full py-1.5 border border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium cursor-pointer"
                  >
                    + Add Course
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className={`flex-1 overflow-auto p-2 sm:p-3 md:p-6 bg-slate-200/90 print:bg-white flex flex-col items-center hide-scrollbar print:overflow-visible print:h-auto print:p-0 print:block ${mobileTab === "preview" ? "flex" : "hidden md:flex"}`}>
        {/* Zoom Controls Bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs print:hidden shrink-0">
          <span className="text-xs font-semibold text-slate-600">Zoom:</span>
          <button
            onClick={() => setZoom((z) => Math.max(35, z - 5))}
            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer"
          >
            -
          </button>
          <span className="text-xs font-bold text-slate-800 min-w-[36px] text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(120, z + 5))}
            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer"
          >
            +
          </button>
          <div className="h-3.5 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                const fit = Math.min(100, Math.floor(((window.innerWidth - 32) / 794) * 100));
                setZoom(Math.max(38, fit));
              }
            }}
            className="text-xs px-2 py-0.5 rounded cursor-pointer transition-colors text-slate-600 hover:bg-slate-100"
          >
            Fit Screen
          </button>
          <button
            onClick={() => setZoom(75)}
            className={`text-xs px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
              zoom === 75 ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            75%
          </button>
          <button
            onClick={() => setZoom(100)}
            className={`text-xs px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
              zoom === 100 ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            100%
          </button>
          <div className="h-3.5 w-px bg-slate-300 mx-1" />
          <span className="text-xs font-semibold text-slate-600">Font:</span>
          <button
            type="button"
            onClick={() => setResumeFontSize("compact")}
            className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
              resumeFontSize === "compact"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Compact
          </button>
          <button
            type="button"
            onClick={() => setResumeFontSize("standard")}
            className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
              resumeFontSize === "standard"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setResumeFontSize("large")}
            className={`text-xs px-2 py-0.5 rounded cursor-pointer transition-colors ${
              resumeFontSize === "large"
                ? "bg-blue-600 text-white font-bold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Large
          </button>
        </div>

        {/* Scaled A4 Wrapper */}
        <div
          style={{ width: `${210 * (zoom / 100)}mm` }}
          className="transition-all duration-150 shrink-0 mx-auto"
        >
          <div
            ref={previewRef}
            id="resume-print-area"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
            }}
            className={`w-[210mm] min-h-[297mm] max-h-[297mm] bg-white shadow-2xl rounded-sm text-slate-900 font-sans shrink-0 print:shadow-none print:w-full print:transform-none print:max-h-none overflow-hidden ${
              resumeFontSize === "compact" ? "p-[8mm]" : resumeFontSize === "large" ? "p-[11mm]" : "p-[10mm]"
            }`}
          >
            {/* ========================================================= */}
            {/* TEMPLATE 1: Executive 2-Column (Brad Jensen style) */}
            {/* ========================================================= */}
            {currentTemplate === "executive" && (
              <div className="flex flex-col h-full text-slate-900 leading-normal">
                {/* Header */}
                <header className="border-b-2 border-slate-900 pb-2.5 mb-3.5">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-slate-900 mb-0.5">
                    {formData.personalInfo?.fullName || "YOUR NAME"}
                  </h1>
                  {formData.personalInfo?.headline && (
                    <p className="text-xs md:text-[13px] font-bold text-sky-700 tracking-wide mb-1.5">
                      {formData.personalInfo.headline}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-700 font-medium">
                    {formData.personalInfo?.phone && <span>{formData.personalInfo.phone}</span>}
                    {formData.personalInfo?.email && (
                      <span>{formData.personalInfo?.phone ? " • " : ""}{formData.personalInfo.email}</span>
                    )}
                    {formData.personalInfo?.linkedin && (
                      <span> • {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    )}
                    {formData.personalInfo?.location && <span> • {formData.personalInfo.location}</span>}
                  </div>
                </header>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-12 gap-5 flex-1">
                  {/* Left Column (60%) */}
                  <div className="col-span-7 space-y-3">
                    {formData.professionalSummary && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Summary
                        </h2>
                        <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify">
                          {renderFormattedText(formData.professionalSummary)}
                        </p>
                      </section>
                    )}

                    {formData.experience?.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Experience
                        </h2>
                        <div className="space-y-2.5">
                          {formData.experience.map((exp, i) => (
                            <div key={i}>
                              <div className="font-bold text-[12px] text-slate-900 leading-tight">
                                {exp.position}
                              </div>
                              <div className="text-[11.5px] font-semibold text-sky-700">
                                {exp.company}
                              </div>
                              <div className="text-[10px] text-slate-500 font-medium mb-0.5 flex items-center gap-2">
                                <span>
                                  {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                                </span>
                                {exp.location && <span>• {exp.location}</span>}
                              </div>
                              <ul className="list-disc list-outside ml-3.5 text-[11px] text-slate-800 space-y-0.5 leading-snug">
                                {exp.description?.map((bullet, j) => (
                                  <li key={j}>{renderFormattedText(bullet)}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Projects in Executive Column */}
                    {formData.projects?.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Key Projects
                        </h2>
                        <div className="space-y-2">
                          {formData.projects.map((proj, i) => (
                            <div key={i}>
                              <div className="flex items-center gap-1 font-bold text-[12px] text-slate-900">
                                <span>{proj.name}</span>
                                {proj.link && (
                                  <a href={proj.link} target="_blank" rel="noreferrer" className="text-sky-600 inline-block">
                                    <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                              {proj.technologies?.length > 0 && (
                                <div className="text-[10.5px] text-slate-600 font-medium mb-0.5">
                                  Tech: {proj.technologies.join(", ")}
                                </div>
                              )}
                              <ul className="list-disc list-outside ml-3.5 text-[10.5px] text-slate-800 space-y-0.5 leading-snug">
                                {proj.description?.map((b, j) => (
                                  <li key={j}>{renderFormattedText(b)}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Right Column (40%) */}
                  <div className="col-span-5 space-y-3 border-l border-slate-200 pl-4">
                    {/* Key Achievements */}
                    {formData.keyAchievements && formData.keyAchievements.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Key Achievements
                        </h2>
                        <div className="space-y-1.5">
                          {formData.keyAchievements.map((ach, i) => (
                            <div key={i}>
                              <div className="text-[11px] font-bold text-slate-900 leading-tight">
                                {ach.title}
                              </div>
                              <p className="text-[10px] text-slate-700 leading-snug mt-0.5">
                                {renderFormattedText(ach.description)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Skills Badges */}
                    {(formData.skills?.languages?.length > 0 ||
                      formData.skills?.frameworks?.length > 0 ||
                      formData.skills?.tools?.length > 0) && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Skills
                        </h2>
                        <div className="flex flex-wrap gap-1">
                          {[
                            ...(formData.skills?.languages || []),
                            ...(formData.skills?.frameworks || []),
                            ...(formData.skills?.tools || []),
                          ].map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 text-[10px] font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Education */}
                    {formData.education?.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Education
                        </h2>
                        <div className="space-y-1.5">
                          {formData.education.map((edu, i) => (
                            <div key={i}>
                              <div className="text-[11.5px] font-bold text-slate-900 leading-tight">
                                {edu.degree}
                              </div>
                              <div className="text-[11px] font-semibold text-sky-700">
                                {edu.institution}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {edu.startDate} {edu.startDate && edu.endDate && "–"} {edu.endDate}
                                {edu.location && ` • ${edu.location}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Training / Courses with Duration */}
                    {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Training / Courses
                        </h2>
                        <div className="space-y-1.5">
                          {formData.trainingCourses.map((c, i) => (
                            <div key={i}>
                              <div className="flex items-baseline justify-between text-[11px] font-bold text-slate-900 leading-tight">
                                <span>{c.name}</span>
                                {c.duration && (
                                  <span className="text-[9.5px] font-semibold text-sky-700">{c.duration}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-700 leading-snug mt-0.5">
                                {renderFormattedText(c.description)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Languages */}
                    {formData.languages && formData.languages.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Languages
                        </h2>
                        <div className="space-y-1">
                          {formData.languages.map((l, i) => (
                            <div key={i} className="flex items-center justify-between text-[10.5px]">
                              <span className="font-bold text-slate-800">{l.name}</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((seg) => (
                                  <div
                                    key={seg}
                                    className={`w-2.5 h-1.5 rounded-xs ${
                                      seg <= (l.proficiency || 5) ? "bg-sky-600" : "bg-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TEMPLATE 2: Classic 1-Column (Alexander Taylor style) */}
            {/* ========================================================= */}
            {currentTemplate === "classic" && (
              <div className="flex flex-col h-full text-slate-900 leading-normal font-sans">
                {/* Centered Classic Header */}
                <header className="text-center pb-3 mb-3 border-b border-slate-300">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1 font-serif">
                    {formData.personalInfo?.fullName || "YOUR NAME"}
                  </h1>
                  {formData.personalInfo?.headline && (
                    <p className="text-xs md:text-[12.5px] font-semibold text-slate-700 tracking-wide mb-1.5">
                      {formData.personalInfo.headline}
                    </p>
                  )}
                  <div className="text-[11px] text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-medium">
                    {formData.personalInfo?.phone && <span>{formData.personalInfo.phone}</span>}
                    {formData.personalInfo?.email && (
                      <span>{formData.personalInfo?.phone ? " • " : ""}{formData.personalInfo.email}</span>
                    )}
                    {formData.personalInfo?.linkedin && (
                      <span> • {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    )}
                    {formData.personalInfo?.location && <span> • {formData.personalInfo.location}</span>}
                  </div>
                </header>

                <div className="space-y-3 text-slate-800">
                  {/* Summary */}
                  {formData.professionalSummary && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
                        Summary
                      </h2>
                      <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify">
                        {renderFormattedText(formData.professionalSummary)}
                      </p>
                    </section>
                  )}

                  {/* Experience */}
                  {formData.experience?.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                        Experience
                      </h2>
                      <div className="space-y-2">
                        {formData.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900 text-[12px]">{exp.company}</span>
                              {exp.location && (
                                <span className="text-[10.5px] text-slate-600 font-medium">
                                  {exp.location}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-baseline mb-0.5">
                              <span className="font-semibold text-slate-800 italic text-[11.5px]">
                                {exp.position}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                              </span>
                            </div>
                            <ul className="list-disc list-outside ml-4 text-[11px] text-slate-800 space-y-0.5 leading-snug">
                              {exp.description?.map((bullet, j) => (
                                <li key={j}>{renderFormattedText(bullet)}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Projects */}
                  {formData.projects?.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                        Projects
                      </h2>
                      <div className="space-y-2">
                        {formData.projects.map((proj, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900 text-[11.5px]">{proj.name}</span>
                              {proj.link && (
                                <a href={proj.link} target="_blank" rel="noreferrer" className="text-[10px] text-sky-600 hover:underline">
                                  Link
                                </a>
                              )}
                            </div>
                            {proj.technologies?.length > 0 && (
                              <div className="text-[10px] text-slate-600 italic">
                                Technologies: {proj.technologies.join(", ")}
                              </div>
                            )}
                            <ul className="list-disc list-outside ml-4 text-[10.5px] text-slate-800 space-y-0.5 leading-snug">
                              {proj.description?.map((bullet, j) => (
                                <li key={j}>{renderFormattedText(bullet)}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Skills */}
                  {(formData.skills?.languages?.length > 0 ||
                    formData.skills?.frameworks?.length > 0 ||
                    formData.skills?.tools?.length > 0) && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
                        Skills
                      </h2>
                      <p className="text-[11px] text-slate-800 text-center font-medium leading-relaxed">
                        {[
                          ...(formData.skills?.languages || []),
                          ...(formData.skills?.frameworks || []),
                          ...(formData.skills?.tools || []),
                        ].join(" • ")}
                      </p>
                    </section>
                  )}

                  {/* Training / Courses with Duration */}
                  {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
                        Training / Courses
                      </h2>
                      <div className="space-y-1">
                        {formData.trainingCourses.map((c, i) => (
                          <div key={i} className="text-[10.5px] text-slate-800 leading-snug">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            {c.duration && <span className="font-medium text-sky-700"> ({c.duration})</span>} —{" "}
                            {renderFormattedText(c.description)}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Education */}
                  {formData.education?.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
                        Education
                      </h2>
                      <div className="space-y-1">
                        {formData.education.map((edu, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900 text-[11.5px]">{edu.institution}</span>
                              {edu.location && (
                                <span className="text-[10px] text-slate-600">
                                  {edu.location}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className="text-slate-700 italic text-[11px]">{edu.degree}</span>
                              <span className="text-[10px] text-slate-500">
                                {edu.startDate} {edu.startDate && edu.endDate && "–"} {edu.endDate}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Key Achievements: 3-column bottom grid */}
                  {formData.keyAchievements && formData.keyAchievements.length > 0 && (
                    <section className="pt-1">
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                        Key Achievements
                      </h2>
                      <div className="grid grid-cols-3 gap-3.5">
                        {formData.keyAchievements.slice(0, 3).map((ach, i) => (
                          <div key={i} className="text-left">
                            <h4 className="font-bold text-slate-900 text-[10.5px] mb-0.5 leading-tight">
                              {ach.title}
                            </h4>
                            <p className="text-[9.5px] text-slate-600 leading-snug">
                              {renderFormattedText(ach.description)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Watermark */}
                <div className="mt-auto pt-3 text-right text-[9px] text-slate-400 print:hidden font-sans">
                  Powered by <span className="font-bold text-slate-500">CareerVerse AI</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Voice Assistant */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {showAssistantBubble && aiMessage && (
          <div className="mb-3 bg-white border border-blue-200 shadow-2xl rounded-2xl p-4 max-w-sm w-[330px] sm:w-[350px] animate-in fade-in slide-in-from-bottom-4 relative">
            <div className="flex items-center justify-between mb-2 pr-6">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <span className="font-bold text-xs text-slate-800">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                    autoSpeak ? "bg-blue-100 text-blue-700 font-semibold" : "text-slate-400 hover:bg-slate-100"
                  }`}
                  title={autoSpeak ? "Auto-speak is active" : "Auto-speak is muted"}
                >
                  {autoSpeak ? "Voice ON" : "Muted"}
                </button>
                <button
                  onClick={() => speakResponse(aiMessage)}
                  title="Replay Voice"
                  className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Volume2 size={15} />
                </button>
              </div>
            </div>
            {/* Close Bot Message Button */}
            <button
              onClick={() => setShowAssistantBubble(false)}
              title="Close Assistant"
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X size={15} />
            </button>
            <p className="text-xs text-slate-700 leading-relaxed mb-2.5">{aiMessage}</p>

            {/* Real-time Dynamic Suggestions (Click any suggestion to immediately apply) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {liveSuggestions.length > 0 ? "Click To Apply Suggestions" : "Resume Status"}
                </span>
                {liveSuggestions.length > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                    {liveSuggestions.length} available
                  </span>
                )}
              </div>

              {liveSuggestions.length > 0 ? (
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-0.5">
                  {liveSuggestions.slice(0, 3).map((sugg, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (!isProcessingVoice) {
                          runAssistantCommand(`Please apply this suggestion to my resume: ${sugg}`);
                        }
                      }}
                      className="group p-2 rounded-lg border border-blue-100/90 bg-linear-to-r from-blue-50/50 to-indigo-50/30 hover:border-blue-400 hover:bg-blue-50/80 transition-all cursor-pointer flex items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="flex items-start gap-1.5 min-w-0 flex-1">
                        <Sparkles size={13} className="text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-800 leading-snug font-medium line-clamp-2">
                          {sugg}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          runAssistantCommand(`Please apply this suggestion to my resume: ${sugg}`);
                        }}
                        disabled={isProcessingVoice}
                        className="shrink-0 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 p-2 rounded-lg font-medium mb-2.5 leading-snug">
                  All key sections are filled! Ready for final ATS optimization.
                </p>
              )}

              {/* 1-Click Fast Actions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => runAssistantCommand("Please optimize my entire resume for ATS screening with strong action verbs and metric enhancements.")}
                  disabled={isProcessingVoice}
                  className="text-[10px] bg-blue-600 text-white hover:bg-blue-700 font-semibold px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Optimize Resume
                </button>
                <button
                  type="button"
                  onClick={() => runAssistantCommand("Please polish my professional summary to be concise, metric-driven, and high-impact.")}
                  disabled={isProcessingVoice}
                  className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  Polish Summary
                </button>
                <button
                  type="button"
                  onClick={() => runAssistantCommand("Quantify my experience and project bullets with realistic metrics and strong verbs.")}
                  disabled={isProcessingVoice}
                  className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2 py-1 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  Add Metrics
                </button>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            if (!showAssistantBubble) {
              setShowAssistantBubble(true);
            }
            toggleListening();
          }}
          disabled={isProcessingVoice}
          aria-label={isListening ? "Stop Voice Assistant" : "Start Voice Assistant"}
          className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all cursor-pointer ${
            isListening
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : isProcessingVoice
              ? "bg-slate-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
          }`}
        >
          {isProcessingVoice ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : isListening ? (
            <MicOff size={24} className="text-white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* Guest Sign-in Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Save to your Account</h3>
            <p className="text-sm text-slate-600 mb-6">
              Your resume draft is safely stored in your browser. Sign in to sync across devices, access ATS analysis,
              and apply directly to internships.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Keep editing
              </button>
              <a
                href="/auth/signin?callbackUrl=/create-resume"
                className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
