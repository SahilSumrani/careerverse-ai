"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
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
  FileCode,
  FileType,
} from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

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
    description: string;
  }>;
  languages?: Array<{
    name: string;
    proficiency: number; // 1 to 5
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// Sample fallback content matching screenshots if user starts from scratch
const SAMPLE_DATA: ResumeData = {
  templateId: "executive",
  personalInfo: {
    fullName: "Brad Jensen",
    headline: "Chief Experience Officer | Customer-Centric Strategies | Digital Transformation",
    email: "b.jensen@enhancv.com",
    phone: "(212) 555-01XX",
    location: "Indianapolis, Indiana",
    linkedin: "linkedin.com/in/bradjensen",
    github: "github.com/bradjensen",
  },
  professionalSummary:
    "With over 15 years in customer experience management, I excel in creating impactful strategies that enhance journeys. Proven record includes achieving a 30% increase in customer satisfaction through innovative initiatives, all backed by strong analytical skills and leadership in dynamic environments.",
  experience: [
    {
      company: "TechForward Solutions",
      position: "Chief Experience Officer",
      startDate: "01/2023",
      endDate: "Present",
      location: "Indianapolis, IN",
      description: [
        "Developed and implemented an extensive customer experience strategy that achieved a 40% increase in Net Promoter Score (NPS) within the first year.",
        "Led a cross-functional team to enhance customer journey mappings, increasing conversion rates by 25% through informed insights.",
        "Collaborated closely with product and marketing teams, resulting in a 30% reduction in customer complaints by aligning service offerings with expectations.",
      ],
    },
    {
      company: "VisionaryTech Innovations",
      position: "Director of Customer Experience",
      startDate: "06/2018",
      endDate: "12/2022",
      location: "Chicago, IL",
      description: [
        "Oversaw the re-design of the customer feedback loop, leading to an increase in actionable insights and a 35% improvement in satisfaction ratings.",
        "Facilitated a series of workshops to empower teams on customer-centric thinking, contributing to an increase in service quality.",
      ],
    },
    {
      company: "InnovativeDigital Corp.",
      position: "Customer Experience Manager",
      startDate: "05/2014",
      endDate: "05/2018",
      location: "Louisville, KY",
      description: [
        "Launched a customer journey optimization project that improved user feedback scores, leading to a significant enhancement in service processes.",
      ],
    },
  ],
  education: [
    {
      institution: "University of Chicago",
      degree: "Master of Business Administration (MBA)",
      startDate: "2012",
      endDate: "2014",
      location: "Chicago, IL",
      score: "3.9 GPA",
    },
  ],
  projects: [],
  skills: {
    languages: ["Customer Experience Strategy", "Journey Mapping Techniques", "CRM Software Expertise"],
    frameworks: ["Team Leadership & Mentoring", "Analytical Thinking", "Effective Communication"],
    tools: ["Data Analysis & Interpretation", "Problem-Solving", "Agile Leadership"],
  },
  keyAchievements: [
    {
      title: "Revamped Customer Feedback System",
      description:
        "Introduced an innovative feedback system at TechForward Solutions that enhanced response rates by 50%, leading to actionable insights that drove initiatives to improve satisfaction.",
    },
    {
      title: "Increased Customer Retention",
      description:
        "Successfully designed a customer loyalty program at VisionaryTech Innovations that increased retention by 20%, significantly improving overall profitability for the year.",
    },
    {
      title: "Elevated Service Quality",
      description:
        "Implemented a new training curriculum at InnovativeDigital Corp. that increased customer service quality ratings by 30% within six months.",
    },
  ],
  trainingCourses: [
    {
      name: "Customer Experience Management",
      provider: "Coursera",
      description:
        "An in-depth program by Coursera focused on strategic customer experience improvements, delivered by leading industry experts.",
    },
    {
      name: "Data-Driven Decisions",
      provider: "edX",
      description:
        "This Excel-based course provided by edX teaches how to make informed strategic decisions based on customer data analysis.",
    },
  ],
  languages: [
    { name: "English", proficiency: 5 },
    { name: "Spanish", proficiency: 4 },
  ],
};

// Tag editor for skills (replaces the string splitting anti-pattern)
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
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
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
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent"
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
  const [activeTab, setActiveTab] = useState<
    "personal" | "summary" | "experience" | "education" | "skills" | "achievements" | "courses"
  >("personal");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [voiceLang, setVoiceLang] = useState<"en" | "hi">("en");
  const previewRef = useRef<HTMLDivElement>(null);

  const initialValues: ResumeData = {
    ...SAMPLE_DATA,
    ...(initialData || {}),
    personalInfo: {
      ...SAMPLE_DATA.personalInfo,
      ...(initialData?.personalInfo || {}),
    },
    skills: {
      languages: initialData?.skills?.languages?.length ? initialData.skills.languages : SAMPLE_DATA.skills.languages,
      frameworks: initialData?.skills?.frameworks?.length ? initialData.skills.frameworks : SAMPLE_DATA.skills.frameworks,
      tools: initialData?.skills?.tools?.length ? initialData.skills.tools : SAMPLE_DATA.skills.tools,
    },
    templateId: initialData?.templateId || "executive",
  };

  const { register, control, watch, reset, getValues, setValue } = useForm<ResumeData>({
    defaultValues: initialValues,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
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

  useEffect(() => {
    if (initialData && !isInitialized.current) {
      reset(initialValues);
      isInitialized.current = true;
    } else if (!isInitialized.current) {
      const draft = localStorage.getItem("cv_resume_draft");
      if (draft) {
        try {
          reset(JSON.parse(draft));
          isInitialized.current = true;
        } catch (e) {
          console.error("Failed to parse resume draft", e);
        }
      }
    }
  }, [initialData, reset]);

  const formData = watch();
  const currentTemplate = formData.templateId || "executive";

  // Auto-save draft to localStorage (guest & authenticated)
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("cv_resume_draft", JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(handler);
  }, [formData]);

  // Handle Save to Account or Prompt Sign-in
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
      if (!res.ok) {
        throw new Error(resData.error || "Failed to save resume");
      }
      setSaveStatus("Saved to your account!");
      setTimeout(() => setSaveStatus(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      alert(err.message || "Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF (Print-to-PDF / Clean print layout)
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

  // Export DOCX using docx library
  const exportDOCX = async () => {
    try {
      const data = getValues();
      const docChildren: Paragraph[] = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: data.personalInfo.fullName || "Candidate", bold: true, size: 32 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: data.personalInfo.headline || "",
              italics: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: [data.personalInfo.email, data.personalInfo.phone, data.personalInfo.location, data.personalInfo.linkedin]
                .filter(Boolean)
                .join(" | "),
              size: 18,
            }),
          ],
        }),
      ];

      if (data.professionalSummary) {
        docChildren.push(new Paragraph({ children: [] }));
        docChildren.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "SUMMARY", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: data.professionalSummary })],
          })
        );
      }

      if (data.experience?.length) {
        docChildren.push(new Paragraph({ children: [] }));
        docChildren.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "EXPERIENCE", bold: true })],
          })
        );
        for (const exp of data.experience) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${exp.company} — ${exp.position}`, bold: true }),
                new TextRun({ text: `  (${exp.startDate} - ${exp.endDate})`, italics: true }),
              ],
            })
          );
          for (const bullet of exp.description || []) {
            docChildren.push(
              new Paragraph({
                bullet: { level: 0 },
                children: [new TextRun({ text: bullet })],
              })
            );
          }
        }
      }

      if (data.education?.length) {
        docChildren.push(new Paragraph({ children: [] }));
        docChildren.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "EDUCATION", bold: true })],
          })
        );
        for (const edu of data.education) {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${edu.institution} — ${edu.degree}`, bold: true }),
                new TextRun({ text: ` (${edu.startDate} - ${edu.endDate})`, italics: true }),
              ],
            })
          );
        }
      }

      const allSkills = [
        ...(data.skills?.languages || []),
        ...(data.skills?.frameworks || []),
        ...(data.skills?.tools || []),
      ];
      if (allSkills.length) {
        docChildren.push(new Paragraph({ children: [] }));
        docChildren.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "SKILLS", bold: true })],
          }),
          new Paragraph({
            children: [new TextRun({ text: allSkills.join(", ") })],
          })
        );
      }

      const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
      });
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(data.personalInfo.fullName || "resume").replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("DOCX export error:", e);
      alert("Failed to export DOCX. Please try again.");
    }
  };

  // Clean native audio player ref
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const speakResponse = async (text: string, lang: "en" | "hi") => {
    if (!text || typeof window === "undefined") return;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      await audio.play();
    } catch (e) {
      console.error("Audio error:", e);
    }
  };

  const recognitionRef = useRef<any>(null);

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
      recognition.lang = voiceLang === "hi" ? "hi-IN" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessingVoice(false);
        setAiMessage(
          voiceLang === "hi"
            ? "🎙️ Sun raha hoon... Boliye kya add karna hai"
            : "🎙️ Listening... Tell me what to add to your resume"
        );
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (!transcript) return;

        setIsListening(false);
        setIsProcessingVoice(true);
        setAiMessage(`"${transcript}"...`);

        try {
          const currentValues = getValues();
          const res = await fetch("/api/resume/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript, resumeState: currentValues }),
          });
          if (!res.ok) throw new Error("Assistant request failed");
          const responseData = await res.json();
          const { updatedResume, aiResponse } = responseData?.data || {};

          if (updatedResume) {
            reset({
              ...currentValues,
              ...updatedResume,
              personalInfo: { ...currentValues.personalInfo, ...(updatedResume.personalInfo || {}) },
              skills: { ...currentValues.skills, ...(updatedResume.skills || {}) },
            });
          }
          const reply = aiResponse || (voiceLang === "hi" ? "Resume update ho gaya!" : "Updated your resume!");
          setAiMessage(reply);
          speakResponse(reply, voiceLang);
        } catch (err) {
          setAiMessage("Could not update. Please try again.");
        } finally {
          setIsProcessingVoice(false);
        }
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
    } catch (err) {
      setIsListening(false);
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-100 print:h-auto print:overflow-visible print:block">
      {/* LEFT: Editor */}
      <div className="w-full md:w-[45%] lg:w-[42%] h-full flex flex-col border-r border-slate-200 bg-white print:hidden shrink-0 shadow-sm">
        {/* Top bar with back, template switcher, and action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200 bg-slate-50/70">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-1"
          >
            &larr; Back
          </button>

          {/* Template Switcher */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setValue("templateId", "executive")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                currentTemplate === "classic"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileType size={13} />
              Classic (1-Col)
            </button>
          </div>

          {/* Actions: Save & Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToAccount}
              disabled={isSaving}
              title={session?.user ? "Save to CareerVerse account" : "Sign in to save"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
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

            <div className="flex items-center gap-1">
              <button
                onClick={exportPDF}
                disabled={isExporting}
                title="Download Print-ready PDF"
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                <span>PDF</span>
              </button>
              <button
                onClick={exportDOCX}
                title="Export as Word DOCX"
                className="flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <FileCode size={14} />
                <span>DOCX</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar bg-white">
          {[
            { id: "personal", label: "Personal" },
            { id: "summary", label: "Summary" },
            { id: "experience", label: "Experience" },
            { id: "education", label: "Education" },
            { id: "skills", label: "Skills" },
            { id: "achievements", label: "Achievements" },
            { id: "courses", label: "Courses & Languages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/30"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  {...register("personalInfo.fullName")}
                  placeholder="e.g. Brad Jensen"
                  className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Headline / Target Title (shows under name)
                </label>
                <input
                  {...register("personalInfo.headline")}
                  placeholder="e.g. Chief Experience Officer | Customer-Centric Strategies | Digital Transformation"
                  className="w-full p-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                    placeholder="e.g. Indianapolis, Indiana"
                    className="w-full p-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
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
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Summary</label>
                <textarea
                  {...register("professionalSummary")}
                  rows={6}
                  placeholder="Write a compelling executive summary emphasizing your career trajectory and key strengths..."
                  className="w-full p-3 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 leading-relaxed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Keep it between 3–5 sentences highlighting leadership, metrics, and domain mastery.
                </p>
              </div>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-4 animate-in fade-in">
              {expFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeExp(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Company</label>
                        <input
                          {...register(`experience.${index}.company`)}
                          placeholder="TechForward Solutions"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Position / Title</label>
                        <input
                          {...register(`experience.${index}.position`)}
                          placeholder="Chief Experience Officer"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Start Date</label>
                        <input
                          {...register(`experience.${index}.startDate`)}
                          placeholder="01/2023"
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
                          placeholder="Indianapolis, IN"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">
                        Bullet Points (one per line)
                      </label>
                      <textarea
                        rows={4}
                        defaultValue={(formData.experience?.[index]?.description || []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n").filter((l) => l.trim().length > 0);
                          setValue(`experience.${index}.description`, lines);
                        }}
                        placeholder="• Achieved a 40% increase in NPS within the first year&#10;• Led cross-functional team of 15 members"
                        className="w-full p-2 text-xs border border-slate-300 rounded bg-white font-mono"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Plus size={15} /> Add Work Experience
              </button>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-4 animate-in fade-in">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeEdu(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid gap-3 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Institution</label>
                      <input
                        {...register(`education.${index}.institution`)}
                        placeholder="University of Chicago"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Degree / Study</label>
                      <input
                        {...register(`education.${index}.degree`)}
                        placeholder="Master of Business Administration (MBA)"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Start Date</label>
                        <input
                          {...register(`education.${index}.startDate`)}
                          placeholder="2012"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">End Date</label>
                        <input
                          {...register(`education.${index}.endDate`)}
                          placeholder="2014"
                          className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-0.5">Score / Honors</label>
                        <input
                          {...register(`education.${index}.score`)}
                          placeholder="3.9 GPA"
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
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Plus size={15} /> Add Education
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
                    label="Core Competencies & Strategy"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Customer Experience Strategy, CRM Software"
                  />
                )}
              />

              <Controller
                control={control}
                name="skills.frameworks"
                render={({ field }) => (
                  <TagInput
                    label="Methodologies & Leadership"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Team Leadership, Journey Mapping, Agile"
                  />
                )}
              />

              <Controller
                control={control}
                name="skills.tools"
                render={({ field }) => (
                  <TagInput
                    label="Tools & Platforms"
                    tags={field.value || []}
                    onChange={field.onChange}
                    placeholder="e.g. Salesforce, Excel, SQL, Google Analytics"
                  />
                )}
              />
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-4 animate-in fade-in">
              <p className="text-xs text-slate-500">
                Key achievements appear prominently in both templates (right column in Executive, bottom grid in Classic).
              </p>
              {achFields.map((field, index) => (
                <div key={field.id} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                  <button
                    type="button"
                    onClick={() => removeAch(index)}
                    className="absolute top-3 right-3 text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="space-y-2 pr-6">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Achievement Title</label>
                      <input
                        {...register(`keyAchievements.${index}.title` as any)}
                        placeholder="e.g. Revamped Customer Feedback System"
                        className="w-full p-1.5 text-sm border border-slate-300 rounded bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-0.5">Description & Outcome</label>
                      <textarea
                        rows={2}
                        {...register(`keyAchievements.${index}.description` as any)}
                        placeholder="Introduced a system that enhanced response rates by 50%..."
                        className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendAch({ title: "", description: "" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-semibold cursor-pointer"
              >
                <Plus size={15} /> Add Key Achievement
              </button>
            </div>
          )}

          {activeTab === "courses" && (
            <div className="space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Training / Courses</h3>
                <div className="space-y-3">
                  {courseFields.map((field, index) => (
                    <div key={field.id} className="p-3 border border-slate-200 rounded-xl bg-slate-50/70 relative">
                      <button
                        type="button"
                        onClick={() => removeCourse(index)}
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                      <div className="space-y-2 pr-6">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            {...register(`trainingCourses.${index}.name` as any)}
                            placeholder="Course name"
                            className="p-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                          />
                          <input
                            {...register(`trainingCourses.${index}.provider` as any)}
                            placeholder="Provider (Coursera, edX)"
                            className="p-1.5 text-xs border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <input
                          {...register(`trainingCourses.${index}.description` as any)}
                          placeholder="Brief description of skills or certification gained"
                          className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendCourse({ name: "", provider: "", description: "" })}
                    className="w-full py-2 border border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium"
                  >
                    + Add Training / Course
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Languages</h3>
                <div className="space-y-2">
                  {langFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <input
                        {...register(`languages.${index}.name` as any)}
                        placeholder="Language (e.g. English)"
                        className="flex-1 p-1.5 text-xs border border-slate-300 rounded bg-white font-medium"
                      />
                      <select
                        {...register(`languages.${index}.proficiency` as any, { valueAsNumber: true })}
                        className="p-1.5 text-xs border border-slate-300 rounded bg-white"
                      >
                        <option value={5}>Native / Fluent (5/5)</option>
                        <option value={4}>Advanced (4/5)</option>
                        <option value={3}>Intermediate (3/5)</option>
                        <option value={2}>Elementary (2/5)</option>
                        <option value={1}>Beginner (1/5)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeLang(index)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => appendLang({ name: "", proficiency: 5 })}
                    className="w-full py-2 border border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium mt-1"
                  >
                    + Add Language
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Preview of Selected Template */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200/70 print:bg-white flex justify-center hide-scrollbar print:overflow-visible print:h-auto print:p-0 print:block">
        {/* Printable / Viewable Container */}
        <div
          ref={previewRef}
          id="resume-print-area"
          className="w-[210mm] min-h-[297mm] bg-white shadow-2xl rounded-sm p-[10mm] md:p-[12mm] text-slate-800 transition-all transform origin-top md:scale-100 scale-75 print:scale-100 print:transform-none print:w-full print:min-h-0 print:shadow-none print:p-[10mm] print:m-0 shrink-0 font-sans"
        >
          {/* TEMPLATE 1: Executive 2-Column (Brad Jensen style) */}
          {currentTemplate === "executive" && (
            <div className="flex flex-col h-full text-slate-900">
              {/* Header */}
              <header className="border-b-2 border-slate-900 pb-3 mb-4">
                <h1 className="text-3xl font-extrabold tracking-tight uppercase text-slate-900 leading-none mb-1.5">
                  {formData.personalInfo?.fullName || "YOUR NAME"}
                </h1>
                {formData.personalInfo?.headline && (
                  <p className="text-xs font-bold text-sky-700 tracking-wide mb-2">
                    {formData.personalInfo.headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 font-medium">
                  {formData.personalInfo?.phone && <span>📞 {formData.personalInfo.phone}</span>}
                  {formData.personalInfo?.email && <span>✉️ {formData.personalInfo.email}</span>}
                  {formData.personalInfo?.linkedin && (
                    <span>🔗 {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  )}
                  {formData.personalInfo?.location && <span>📍 {formData.personalInfo.location}</span>}
                </div>
              </header>

              {/* 2-Column Body */}
              <div className="grid grid-cols-12 gap-6 flex-1">
                {/* LEFT MAIN COLUMN (~62% width) */}
                <div className="col-span-7 space-y-4">
                  {formData.professionalSummary && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Summary
                      </h2>
                      <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                        {formData.professionalSummary}
                      </p>
                    </section>
                  )}

                  {formData.experience?.length > 0 && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-3">
                        Experience
                      </h2>
                      <div className="space-y-3.5">
                        {formData.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="font-bold text-[12px] text-slate-900 leading-tight">
                              {exp.position}
                            </div>
                            <div className="text-[11px] font-semibold text-sky-700">
                              {exp.company}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mb-1 flex items-center gap-2">
                              <span>
                                {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                              </span>
                              {exp.location && <span>• {exp.location}</span>}
                            </div>
                            <ul className="list-disc list-outside ml-3.5 text-[10.5px] text-slate-700 space-y-1 leading-snug">
                              {exp.description?.map((bullet, j) => (
                                <li key={j}>{bullet}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* RIGHT SIDEBAR COLUMN (~38% width) */}
                <div className="col-span-5 space-y-4 border-l border-slate-200 pl-5">
                  {/* Key Achievements */}
                  {formData.keyAchievements && formData.keyAchievements.length > 0 && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Key Achievements
                      </h2>
                      <div className="space-y-2.5">
                        {formData.keyAchievements.map((ach, i) => (
                          <div key={i}>
                            <div className="text-[11px] font-bold text-slate-900 leading-tight">
                              {ach.title}
                            </div>
                            <p className="text-[10px] text-slate-600 leading-normal mt-0.5">
                              {ach.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Skills (badges) */}
                  {(formData.skills?.languages?.length > 0 ||
                    formData.skills?.frameworks?.length > 0 ||
                    formData.skills?.tools?.length > 0) && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Skills
                      </h2>
                      <div className="flex flex-wrap gap-1.5">
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
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Education
                      </h2>
                      <div className="space-y-2">
                        {formData.education.map((edu, i) => (
                          <div key={i}>
                            <div className="text-[11px] font-bold text-slate-900 leading-tight">
                              {edu.degree}
                            </div>
                            <div className="text-[10.5px] font-medium text-sky-700">
                              {edu.institution}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {edu.startDate} {edu.startDate && edu.endDate && "–"} {edu.endDate}
                              {edu.location && ` • ${edu.location}`}
                              {edu.score && ` • ${edu.score}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Training / Courses */}
                  {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Training / Courses
                      </h2>
                      <div className="space-y-2">
                        {formData.trainingCourses.map((c, i) => (
                          <div key={i}>
                            <div className="text-[10.5px] font-bold text-slate-900 leading-tight">
                              {c.name}
                            </div>
                            <p className="text-[10px] text-slate-600 leading-normal mt-0.5">
                              {c.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Languages with 5-segment bars */}
                  {formData.languages && formData.languages.length > 0 && (
                    <section>
                      <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                        Languages
                      </h2>
                      <div className="space-y-2">
                        {formData.languages.map((l, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[10.5px] font-bold text-slate-800">{l.name}</span>
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

          {/* TEMPLATE 2: Classic 1-Column (Alexander Taylor style) */}
          {currentTemplate === "classic" && (
            <div className="flex flex-col h-full text-slate-900">
              {/* Centered Classic Header */}
              <header className="text-center pb-4 mb-4 border-b border-slate-300">
                <h1 className="text-2xl md:text-3xl font-bold tracking-normal text-slate-900 mb-1 font-serif">
                  {formData.personalInfo?.fullName || "Alexander Taylor"}
                </h1>
                {formData.personalInfo?.headline && (
                  <p className="text-xs font-medium text-slate-700 tracking-wide mb-1.5">
                    {formData.personalInfo.headline}
                  </p>
                )}
                <div className="text-[11px] text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-0.5">
                  {formData.personalInfo?.phone && <span>{formData.personalInfo.phone}</span>}
                  {formData.personalInfo?.email && <span>• {formData.personalInfo.email}</span>}
                  {formData.personalInfo?.linkedin && (
                    <span>• {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                  )}
                  {formData.personalInfo?.location && <span>• {formData.personalInfo.location}</span>}
                </div>
              </header>

              <div className="space-y-4 text-[11px]">
                {/* Summary */}
                {formData.professionalSummary && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                      Summary
                    </h2>
                    <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                      {formData.professionalSummary}
                    </p>
                  </section>
                )}

                {/* Experience (Left: Company/Role, Right: Location/Dates) */}
                {formData.experience?.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 text-center font-serif">
                      Experience
                    </h2>
                    <div className="space-y-3">
                      {formData.experience.map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-slate-900 text-[11.5px]">{exp.company}</span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {exp.location || "San Diego, California"}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="font-semibold text-slate-800 italic text-[11px]">{exp.position}</span>
                            <span className="text-[10px] text-slate-500">
                              {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                            </span>
                          </div>
                          <ul className="list-disc list-outside ml-4 text-[10.5px] text-slate-700 space-y-1 leading-snug">
                            {exp.description?.map((bullet, j) => (
                              <li key={j}>{bullet}</li>
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
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                      Skills
                    </h2>
                    <p className="text-[10.5px] text-slate-700 text-center font-medium">
                      {[
                        ...(formData.skills?.languages || []),
                        ...(formData.skills?.frameworks || []),
                        ...(formData.skills?.tools || []),
                      ].join(" • ")}
                    </p>
                  </section>
                )}

                {/* Training / Courses */}
                {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                      Training / Courses
                    </h2>
                    <div className="space-y-1.5">
                      {formData.trainingCourses.map((c, i) => (
                        <div key={i} className="text-[10.5px] text-slate-700">
                          <span className="font-bold text-slate-900">{c.name}</span> — {c.description}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Education */}
                {formData.education?.length > 0 && (
                  <section>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                      Education
                    </h2>
                    <div className="space-y-1.5">
                      {formData.education.map((edu, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-slate-900">{edu.institution}</span>
                            <span className="text-[10px] text-slate-600">
                              {edu.location || "Stanford, California"}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-700 italic">{edu.degree}</span>
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
                  <section className="pt-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 text-center font-serif">
                      Key Achievements
                    </h2>
                    <div className="grid grid-cols-3 gap-4">
                      {formData.keyAchievements.slice(0, 3).map((ach, i) => (
                        <div key={i} className="text-left">
                          <h4 className="font-bold text-slate-900 text-[10.5px] mb-1 leading-tight">
                            {ach.title}
                          </h4>
                          <p className="text-[9.5px] text-slate-600 leading-snug">
                            {ach.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Bottom watermark / signature */}
              <div className="mt-auto pt-6 text-right text-[9px] text-slate-400 print:hidden font-sans">
                Powered by <span className="font-bold text-slate-500">CareerVerse AI</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Voice Assistant */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {aiMessage && (
          <div className="mb-4 bg-white border border-blue-200 shadow-xl rounded-2xl p-4 max-w-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <span className="font-bold text-xs text-slate-800">AI Assistant</span>
              </div>
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                <button
                  onClick={() => setVoiceLang("en")}
                  className={`px-1.5 py-0.5 rounded ${
                    voiceLang === "en" ? "bg-white font-bold text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setVoiceLang("hi")}
                  className={`px-1.5 py-0.5 rounded ${
                    voiceLang === "hi" ? "bg-white font-bold text-blue-600 shadow-xs" : "text-slate-500"
                  }`}
                >
                  हिं
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600">{aiMessage}</p>
          </div>
        )}
        <button
          onClick={toggleListening}
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

      {/* Guest "Sign in to save" Modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Save to your Account</h3>
            <p className="text-sm text-slate-600 mb-6">
              Your resume draft is safely saved in this browser. To sync across devices, access full ATS scoring,
              and apply directly to jobs, sign in to your CareerVerse account.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
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
