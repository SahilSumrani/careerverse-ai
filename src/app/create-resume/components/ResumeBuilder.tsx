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
    proficiency: number;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

// Clean markdown bold (**) and asterisks (*) into React elements
function renderFormattedText(text: string | undefined): ReactNode {
  if (!text) return null;

  // Split by bold tokens **...**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2).replace(/\*/g, "").trim();
      return (
        <strong key={index} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    }
    // Clean any stray lone asterisks
    const cleaned = part.replace(/\*/g, "");
    return <span key={index}>{cleaned}</span>;
  });
}

// Sample fallback content
const SAMPLE_DATA: ResumeData = {
  templateId: "classic",
  personalInfo: {
    fullName: "Sahil Sumrani",
    headline: "Chief Experience Officer | Customer-Centric Strategies | Digital Transformation",
    email: "officialsahilarora05@gmail.com",
    phone: "8700543448",
    location: "Indianapolis, Indiana",
    linkedin: "linkedin.com/in/sahil-sumrani",
    github: "github.com/sahilsumrani",
  },
  professionalSummary:
    "Motivated and results-driven student with a strong foundation in web development seeking an internship to apply and expand technical skills in a dynamic environment.",
  experience: [
    {
      company: "Chief Electoral Office Delhi",
      position: "Graphic Designing Intern",
      startDate: "06/2023",
      endDate: "Present",
      location: "San Diego, California",
      description: [
        "Collaborated with product teams to outline requirements, resulting in a successful launch of features.",
        "Executed rigorous testing protocols that enhanced software stability and improved user satisfaction.",
      ],
    },
  ],
  education: [
    {
      institution: "School of Open Learning, University of Delhi",
      degree: "Bachelor of Computer Applications",
      startDate: "2023",
      endDate: "2026",
      location: "Delhi, India",
      score: "",
    },
  ],
  projects: [],
  skills: {
    languages: ["JavaScript", "PHP", "HTML", "CSS", "TypeScript"],
    frameworks: ["React.js", "Next.js", "WordPress"],
    tools: ["Shopify", "MongoDB", "Git", "Figma"],
  },
  keyAchievements: [
    {
      title: "Revamped Customer Feedback System",
      description:
        "Introduced an innovative feedback system that enhanced response rates by 50%, leading to actionable insights that drove initiatives to improve satisfaction.",
    },
    {
      title: "Increased Customer Retention",
      description:
        "Successfully designed a customer loyalty program that increased retention by 20%, significantly improving overall profitability.",
    },
    {
      title: "Elevated Service Quality",
      description:
        "Implemented a new training curriculum that increased customer service quality ratings by 30% within six months.",
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
    { name: "Hindi", proficiency: 5 },
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
  const [zoom, setZoom] = useState<number>(75);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

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
    templateId: initialData?.templateId || "classic",
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
  const currentTemplate = formData.templateId || "classic";

  // Auto-save draft to localStorage
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("cv_resume_draft", JSON.stringify(formData));
    }, 800);
    return () => clearTimeout(handler);
  }, [formData]);

  // Voice speech synthesis with infallible fallback
  const speakResponse = async (text: string, lang: "en" | "hi") => {
    if (!text || typeof window === "undefined") return;

    // Stop ongoing audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        };
        await audio.play();
        return;
      }
    } catch {
      // Fall through to native synthesis
    }

    // Native Web Speech fallback ensures assistant ALWAYS talks
    if ("speechSynthesis" in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) =>
            v.lang.startsWith(lang === "hi" ? "hi" : "en") &&
            (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neural"))
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        window.speechSynthesis.speak(utterance);
      } catch (synthErr) {
        console.warn("Speech synthesis error:", synthErr);
      }
    }
  };

  // Clean toggle for voice recognition
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
            ? "🎙️ Sun raha hoon... Boliye kya add karna hai (jaise: 'Mera professional summary improve karo')"
            : "🎙️ Listening... Speak your request (e.g., 'Enhance my summary for web development')"
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
            body: JSON.stringify({
              transcript,
              resumeState: currentValues,
              lang: voiceLang,
            }),
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

          const reply =
            aiResponse ||
            (voiceLang === "hi"
              ? "Aapka resume update ho gaya hai!"
              : "Updated your resume with your request!");

          setAiMessage(reply);
          speakResponse(reply, voiceLang);
        } catch (err: any) {
          console.error("Voice command error:", err);
          const errMsg =
            voiceLang === "hi"
              ? "Command process nahi ho paayi. Kripya dobara koshish karein."
              : "Could not process command. Please try again.";
          setAiMessage(errMsg);
          speakResponse(errMsg, voiceLang);
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
      {/* LEFT: Editor */}
      <div className="w-full md:w-[45%] lg:w-[42%] h-full flex flex-col border-r border-slate-200 bg-white print:hidden shrink-0 shadow-sm">
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

          {/* Actions: Save & PDF Export */}
          <div className="flex items-center gap-2">
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
                  placeholder="e.g. Sahil Sumrani"
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
                  placeholder="Motivated and results-driven student with a strong foundation in..."
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
                        <input
                          {...register(`trainingCourses.${index}.name` as any)}
                          placeholder="Course name"
                          className="w-full p-1 text-xs border border-slate-300 rounded bg-white font-semibold"
                        />
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
                    onClick={() => appendCourse({ name: "", provider: "", description: "" })}
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
      <div className="flex-1 overflow-auto p-3 md:p-6 bg-slate-200/90 print:bg-white flex flex-col items-center hide-scrollbar print:overflow-visible print:h-auto print:p-0 print:block">
        {/* Zoom Controls Bar */}
        <div className="mb-3 flex items-center gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs print:hidden shrink-0">
          <span className="text-xs font-semibold text-slate-600">Zoom:</span>
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 5))}
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
            onClick={() => setZoom(75)}
            className={`text-xs px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
              zoom === 75 ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Fit Page
          </button>
          <button
            onClick={() => setZoom(100)}
            className={`text-xs px-2.5 py-0.5 rounded cursor-pointer transition-colors ${
              zoom === 100 ? "bg-blue-600 text-white font-bold" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            100%
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
            className="w-[210mm] min-h-[297mm] max-h-[297mm] bg-white shadow-2xl rounded-sm p-[10mm] text-slate-900 font-sans shrink-0 print:shadow-none print:w-full print:p-[10mm] print:transform-none print:max-h-none overflow-hidden"
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
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-slate-700 font-medium">
                    {formData.personalInfo?.phone && <span>📞 {formData.personalInfo.phone}</span>}
                    {formData.personalInfo?.email && <span>✉️ {formData.personalInfo.email}</span>}
                    {formData.personalInfo?.linkedin && (
                      <span>🔗 {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    )}
                    {formData.personalInfo?.location && <span>📍 {formData.personalInfo.location}</span>}
                  </div>
                </header>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-12 gap-5 flex-1">
                  {/* Left Column (60%) */}
                  <div className="col-span-7 space-y-3.5">
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
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-2">
                          Experience
                        </h2>
                        <div className="space-y-3">
                          {formData.experience.map((exp, i) => (
                            <div key={i}>
                              <div className="font-bold text-[12.5px] text-slate-900 leading-tight">
                                {exp.position}
                              </div>
                              <div className="text-[12px] font-semibold text-sky-700">
                                {exp.company}
                              </div>
                              <div className="text-[10.5px] text-slate-500 font-medium mb-1 flex items-center gap-2">
                                <span>
                                  {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                                </span>
                                {exp.location && <span>• {exp.location}</span>}
                              </div>
                              <ul className="list-disc list-outside ml-3.5 text-[11px] text-slate-800 space-y-1 leading-snug">
                                {exp.description?.map((bullet, j) => (
                                  <li key={j}>{renderFormattedText(bullet)}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>

                  {/* Right Column (40%) */}
                  <div className="col-span-5 space-y-3.5 border-l border-slate-200 pl-4">
                    {/* Key Achievements */}
                    {formData.keyAchievements && formData.keyAchievements.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Key Achievements
                        </h2>
                        <div className="space-y-2">
                          {formData.keyAchievements.map((ach, i) => (
                            <div key={i}>
                              <div className="text-[11.5px] font-bold text-slate-900 leading-tight">
                                {ach.title}
                              </div>
                              <p className="text-[10.5px] text-slate-700 leading-snug mt-0.5">
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
                        <div className="space-y-2">
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

                    {/* Training / Courses */}
                    {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                      <section>
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                          Training / Courses
                        </h2>
                        <div className="space-y-1.5">
                          {formData.trainingCourses.map((c, i) => (
                            <div key={i}>
                              <div className="text-[11px] font-bold text-slate-900 leading-tight">
                                {c.name}
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
                        <div className="space-y-1.5">
                          {formData.languages.map((l, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px]">
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
                <header className="text-center pb-3.5 mb-3.5 border-b border-slate-300">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1 font-serif">
                    {formData.personalInfo?.fullName || "Sahil Sumrani"}
                  </h1>
                  {formData.personalInfo?.headline && (
                    <p className="text-xs md:text-[12.5px] font-semibold text-slate-700 tracking-wide mb-1.5">
                      {formData.personalInfo.headline}
                    </p>
                  )}
                  <div className="text-[11px] text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-medium">
                    {formData.personalInfo?.phone && <span>{formData.personalInfo.phone}</span>}
                    {formData.personalInfo?.email && <span>• {formData.personalInfo.email}</span>}
                    {formData.personalInfo?.linkedin && (
                      <span>• {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
                    )}
                    {formData.personalInfo?.location && <span>• {formData.personalInfo.location}</span>}
                  </div>
                </header>

                <div className="space-y-3.5 text-slate-800">
                  {/* Summary */}
                  {formData.professionalSummary && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
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
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-2 text-center font-serif">
                        Experience
                      </h2>
                      <div className="space-y-2.5">
                        {formData.experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900 text-[12px]">{exp.company}</span>
                              <span className="text-[10.5px] text-slate-600 font-medium">
                                {exp.location || "San Diego, California"}
                              </span>
                            </div>
                            <div className="flex justify-between items-baseline mb-1">
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

                  {/* Skills */}
                  {(formData.skills?.languages?.length > 0 ||
                    formData.skills?.frameworks?.length > 0 ||
                    formData.skills?.tools?.length > 0) && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
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

                  {/* Training / Courses */}
                  {formData.trainingCourses && formData.trainingCourses.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
                        Training / Courses
                      </h2>
                      <div className="space-y-1">
                        {formData.trainingCourses.map((c, i) => (
                          <div key={i} className="text-[10.5px] text-slate-800 leading-snug">
                            <span className="font-bold text-slate-900">{c.name}</span> —{" "}
                            {renderFormattedText(c.description)}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Education */}
                  {formData.education?.length > 0 && (
                    <section>
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
                        Education
                      </h2>
                      <div className="space-y-1.5">
                        {formData.education.map((edu, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-slate-900 text-[11.5px]">{edu.institution}</span>
                              <span className="text-[10px] text-slate-600">
                                {edu.location || "Stanford, California"}
                              </span>
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
                      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-2 text-center font-serif">
                        Key Achievements
                      </h2>
                      <div className="grid grid-cols-3 gap-4">
                        {formData.keyAchievements.slice(0, 3).map((ach, i) => (
                          <div key={i} className="text-left">
                            <h4 className="font-bold text-slate-900 text-[11px] mb-0.5 leading-tight">
                              {ach.title}
                            </h4>
                            <p className="text-[10px] text-slate-600 leading-snug">
                              {renderFormattedText(ach.description)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Watermark */}
                <div className="mt-auto pt-4 text-right text-[9px] text-slate-400 print:hidden font-sans">
                  Powered by <span className="font-bold text-slate-500">CareerVerse AI</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Voice Assistant */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {aiMessage && (
          <div className="mb-3 bg-white border border-blue-200 shadow-xl rounded-2xl p-4 max-w-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <span className="font-bold text-xs text-slate-800">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => speakResponse(aiMessage, voiceLang)}
                  title="Listen to response"
                  className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Volume2 size={15} />
                </button>
                <div className="flex gap-1 bg-slate-100 p-0.5 rounded text-[11px]">
                  <button
                    onClick={() => setVoiceLang("en")}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      voiceLang === "en" ? "bg-white font-bold text-blue-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setVoiceLang("hi")}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      voiceLang === "hi" ? "bg-white font-bold text-blue-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    हिं
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{aiMessage}</p>
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
