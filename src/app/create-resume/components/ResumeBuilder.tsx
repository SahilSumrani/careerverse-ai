"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Trash2, Download, Mic, MicOff, Volume2, Sparkles } from "lucide-react";

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
  };
  education: Array<{
    institution: string;
    degree: string;
    startDate: string;
    endDate: string;
    score: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
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
  professionalSummary?: string;
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
}

export function ResumeBuilder({
  initialData,
  onBack,
}: {
  initialData?: ResumeData | null;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "projects" | "skills">("personal");
  const [isExporting, setIsExporting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [voiceLang, setVoiceLang] = useState<"en" | "hi">("en");
  const previewRef = useRef<HTMLDivElement>(null);

  const defaultValues: ResumeData = initialData || {
    personalInfo: { fullName: "", email: "", phone: "", linkedin: "", github: "" },
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], tools: [] },
  };

  const { register, control, watch, reset, getValues, setValue, formState: { errors } } = useForm<ResumeData>({
    defaultValues: initialData || defaultValues,
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experience" });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: "projects" });

  const isInitialized = useRef(false);

  // 3 & 5: Load from initialData or localStorage draft
  useEffect(() => {
    if (initialData && !isInitialized.current) {
      reset(initialData);
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

  // Debounce localStorage write to prevent perf hit
  useEffect(() => {
    const handler = setTimeout(() => {
      localStorage.setItem("cv_resume_draft", JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(handler);
  }, [formData]);

  const exportPDF = () => {
    setIsExporting(true);
    // Use afterprint event for accurate timing instead of arbitrary setTimeout
    const handleAfterPrint = () => {
      setIsExporting(false);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
    window.addEventListener('afterprint', handleAfterPrint);

    // Give state time to update UI before print dialog blocks thread
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Free Native Web Speech & Synthesis refs
  const recognitionRef = useRef<any>(null);

  // Preload and cache natural female voices on mount
  const [cachedVoices, setCachedVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        setCachedVoices(v);
      }
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  // Text to speech helper (Strictly Natural Female Voice, 100% Free)
  const speakResponse = (text: string, lang: "en" | "hi") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
      utterance.rate = 1.0;
      utterance.pitch = 1.2; // Feminine pitch

      const allVoices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
      if (allVoices && allVoices.length > 0) {
        const targetPrefix = lang === "hi" ? "hi" : "en";
        const langVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith(targetPrefix));

        // Strictly match female names and filter out any male voices
        const maleKeywords = ["david", "mark", "george", "male", "guy", "stefan", "ravi", "madhav"];
        const femaleKeywords = [
          "zira", "natural", "online", "female", "samantha", "victoria", "kavya", 
          "swara", "priya", "google", "eva", "jenny", "aria", "michelle", "karen", "susan"
        ];

        // 1st priority: Matching language + explicitly female keywords + NOT male
        let chosenVoice = langVoices.find((v) => {
          const name = v.name.toLowerCase();
          const isNotMale = !maleKeywords.some((m) => name.includes(m));
          const isFemale = femaleKeywords.some((f) => name.includes(f));
          return isNotMale && isFemale;
        });

        // 2nd priority: Any matching language voice that is NOT explicitly male
        if (!chosenVoice) {
          chosenVoice = langVoices.find((v) => {
            const name = v.name.toLowerCase();
            return !maleKeywords.some((m) => name.includes(m));
          });
        }

        // 3rd priority: Global natural female voice (like Google US English Female)
        if (!chosenVoice) {
          chosenVoice = allVoices.find((v) => {
            const name = v.name.toLowerCase();
            return (
              !maleKeywords.some((m) => name.includes(m)) &&
              femaleKeywords.some((f) => name.includes(f))
            );
          });
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsListening(false);
      setIsProcessingVoice(false);
      setAiMessage("Voice Assistant paused.");
      return;
    }

    // 0. Browser Web Speech check
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAiMessage("Is browser me Speech Recognition support nahi hai. Chrome ya Edge use karein.");
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
            ? "🎙️ Sun raha hoon... Boliye kya add karna hai (jaise: 'Add React and TypeScript to skills')"
            : "🎙️ Listening... Tell me what to add (e.g., 'Add React and TypeScript to skills')"
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
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to update resume.");
          }

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

          const reply = aiResponse || (voiceLang === "hi" ? "Aapka resume update ho gaya!" : "Updated your resume!");
          setAiMessage(reply);
          speakResponse(reply, voiceLang);
        } catch (err: any) {
          console.error("Assistant Error:", err);
          const errorMsg = err.message || (voiceLang === "hi" ? "Koshish karne me dikkat aayi, kripya dobara bolein." : "Could not process command. Please try again.");
          setAiMessage(errorMsg);
          speakResponse(errorMsg, voiceLang);
        } finally {
          setIsProcessingVoice(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setIsProcessingVoice(false);
        if (event.error === "not-allowed") {
          setAiMessage("🎤 Microphone access denied. Browser address bar me lock icon se mic allow karein.");
        } else if (event.error === "no-speech") {
          setAiMessage("Koi aawaz nahi suni. Mic dabakar dobara boliye.");
        } else {
          setAiMessage(`Speech error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
      setIsProcessingVoice(false);
      setAiMessage("Microphone start karne me error aaya.");
    }
  };



  const sanitizeAndFormat = (text: string) => {
    if (!text) return "";
    // 4: Sanitize raw HTML to prevent XSS, then allow bold markdown
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  };

  // Helper function to handle string array inputs (comma separated)
  const renderStringArrayInput = (label: string, fieldPath: any, placeholder: string) => {
    // We register a simple text input but the underlying value is array of strings.
    // For simplicity in this demo, we'll let user type comma separated strings.
    const val = (watch(fieldPath) as string[])?.join(", ") || "";
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <input
          type="text"
          value={val}
          onChange={(e) => {
            const arr = e.target.value.split(",").map(s => s.trim());
            // This is a hacky way to update. For production, use Controller.
            register(fieldPath).onChange({ target: { name: fieldPath, value: arr } });
          }}
          placeholder={placeholder}
          className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 print:h-auto print:overflow-visible print:block">
      {/* LEFT: Editor */}
      <div className="w-full md:w-1/2 h-full flex flex-col border-r border-slate-200 bg-white print:hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium">
            &larr; Back
          </button>
          <h2 className="font-bold text-lg text-slate-800">Editor</h2>
          <button
            onClick={exportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            <span className="text-sm font-medium">Export PDF</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          {(["personal", "education", "experience", "projects", "skills"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Form Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input {...register("personalInfo.fullName")} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input type="email" {...register("personalInfo.email")} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" {...register("personalInfo.phone")} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <input type="url" {...register("personalInfo.linkedin")} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub URL</label>
                <input type="url" {...register("personalInfo.github")} className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div className="space-y-6 animate-in fade-in">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-lg relative bg-slate-50">
                  <button type="button" onClick={() => removeEdu(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Institution</label>
                      <input {...register(`education.${index}.institution`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Degree / Field of Study</label>
                      <input {...register(`education.${index}.degree`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                        <input {...register(`education.${index}.startDate`)} placeholder="e.g. Aug 2020" className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                        <input {...register(`education.${index}.endDate`)} placeholder="e.g. May 2024" className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">CGPA / Score</label>
                        <input {...register(`education.${index}.score`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendEdu({ institution: "", degree: "", startDate: "", endDate: "", score: "" })} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={18} /> Add Education
              </button>
            </div>
          )}

          {activeTab === "experience" && (
            <div className="space-y-6 animate-in fade-in">
              {expFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-lg relative bg-slate-50">
                  <button type="button" onClick={() => removeExp(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Company</label>
                      <input {...register(`experience.${index}.company`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Position / Title</label>
                      <input {...register(`experience.${index}.position`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
                        <input {...register(`experience.${index}.startDate`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
                        <input {...register(`experience.${index}.endDate`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Description (Bullets, separated by new lines)</label>
                      <textarea
                        className="w-full p-2 text-sm border border-slate-300 rounded-md h-24"
                        value={(formData.experience[index]?.description || []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          register(`experience.${index}.description`).onChange({ target: { name: `experience.${index}.description`, value: lines } });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendExp({ company: "", position: "", startDate: "", endDate: "", description: [] })} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={18} /> Add Experience
              </button>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6 animate-in fade-in">
              {projFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-slate-200 rounded-lg relative bg-slate-50">
                  <button type="button" onClick={() => removeProj(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                  <div className="grid gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
                      <input {...register(`projects.${index}.name`)} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Technologies (comma separated)</label>
                      <input
                        className="w-full p-2 text-sm border border-slate-300 rounded-md"
                        value={(formData.projects[index]?.technologies || []).join(", ")}
                        onChange={(e) => {
                          const arr = e.target.value.split(",").map(s => s.trim());
                          register(`projects.${index}.technologies`).onChange({ target: { name: `projects.${index}.technologies`, value: arr } });
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Description (Bullets, separated by new lines)</label>
                      <textarea
                        className="w-full p-2 text-sm border border-slate-300 rounded-md h-24"
                        value={(formData.projects[index]?.description || []).join("\n")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          register(`projects.${index}.description`).onChange({ target: { name: `projects.${index}.description`, value: lines } });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => appendProj({ name: "", technologies: [], description: [] })} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus size={18} /> Add Project
              </button>
            </div>
          )}

          {activeTab === "skills" && (
            <div className="space-y-6 animate-in fade-in">
              {renderStringArrayInput("Languages (e.g. JavaScript, Python)", "skills.languages", "JavaScript, Python, C++")}
              {renderStringArrayInput("Frameworks & Libraries (e.g. React, Next.js)", "skills.frameworks", "React, Node.js, Next.js")}
              {renderStringArrayInput("Tools & Platforms (e.g. Git, AWS)", "skills.tools", "Git, Docker, AWS, Firebase")}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100/50 print:bg-white flex justify-center hide-scrollbar print:overflow-visible print:h-auto print:p-0 print:block">
        {/* A4 Paper style preview */}
        <div ref={previewRef} className="w-[210mm] min-h-[297mm] bg-white shadow-xl rounded-sm p-[12mm] md:p-[15mm] text-slate-800 transition-all transform origin-top md:scale-100 scale-75 print:scale-100 print:transform-none print:w-full print:min-h-0 print:shadow-none print:p-[15mm] print:m-0 shrink-0 font-sans">
          <header className="text-center mb-6">
            <h1 className="text-4xl font-bold tracking-wide text-slate-900 mb-2">{formData.personalInfo?.fullName || "YOUR NAME"}</h1>
            <div className="text-[13px] text-slate-700 mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
              {formData.personalInfo?.email && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium">Email:</span> {formData.personalInfo.email}
                </span>
              )}
              {formData.personalInfo?.phone && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium">Phone:</span> {formData.personalInfo.phone}
                </span>
              )}
              {formData.personalInfo?.linkedin && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium">LinkedIn:</span> {formData.personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
              {formData.personalInfo?.github && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-500 font-medium">GitHub:</span> {formData.personalInfo.github.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
            </div>
          </header>

          <div className="space-y-4">

            {formData.professionalSummary && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-2">Professional Summary</h2>
                <p className="text-[13px] text-slate-800 leading-relaxed">{formData.professionalSummary}</p>
              </section>
            )}

            {formData.experience?.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-3">Work Experience</h2>
                {formData.experience.map((exp, i) => (
                  <div key={i} className="mb-4">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.company}</span>
                      <span>{exp.startDate} {exp.startDate && exp.endDate && "-"} {exp.endDate}</span>
                    </div>
                    <div className="text-sm font-medium text-slate-700 italic mb-1">{exp.position}</div>
                    <ul className="list-disc list-outside ml-5 mt-1 text-[13px] text-slate-800 space-y-1">
                      {exp.description?.filter(Boolean).map((desc, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(desc) }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {formData.education?.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-3">Education</h2>
                {formData.education.map((edu, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{edu.institution}</span>
                      <span>{edu.startDate} {edu.startDate && edu.endDate && "-"} {edu.endDate}</span>
                    </div>
                    <div className="flex justify-between text-[13px] text-slate-700 mt-1">
                      <span>{edu.degree}</span>
                      {edu.score && <span>CGPA/Score: {edu.score}</span>}
                    </div>
                  </div>
                ))}
              </section>
            )}

            {formData.projects?.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-3">Projects</h2>
                {formData.projects.map((proj, i) => (
                  <div key={i} className="mb-4">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>{proj.name}</span>
                    </div>
                    {proj.technologies?.length > 0 && (
                      <div className="text-[13px] text-slate-700 italic mb-1">
                        Tech Stack: {proj.technologies.join(", ")}
                      </div>
                    )}
                    <ul className="list-disc list-outside ml-5 mt-1 text-[13px] text-slate-800 space-y-1">
                      {proj.description?.filter(Boolean).map((desc, j) => (
                        <li key={j} dangerouslySetInnerHTML={{ __html: sanitizeAndFormat(desc) }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            )}

            {(formData.skills?.languages?.length > 0 || formData.skills?.frameworks?.length > 0 || formData.skills?.tools?.length > 0) && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-3">Skills</h2>
                <div className="text-[13px] text-slate-800 space-y-1.5">
                  {formData.skills.languages?.filter(Boolean).length > 0 && (
                    <div><span className="font-bold text-slate-900">Languages:</span> {formData.skills.languages.filter(Boolean).join(", ")}</div>
                  )}
                  {formData.skills.frameworks?.filter(Boolean).length > 0 && (
                    <div><span className="font-bold text-slate-900">Frameworks:</span> {formData.skills.frameworks.filter(Boolean).join(", ")}</div>
                  )}
                  {formData.skills.tools?.filter(Boolean).length > 0 && (
                    <div><span className="font-bold text-slate-900">Cloud/Databases/Tools:</span> {formData.skills.tools.filter(Boolean).join(", ")}</div>
                  )}
                </div>
              </section>
            )}

            {formData.certifications && formData.certifications.length > 0 && (
              <section className="mb-5">
                <h2 className="text-sm font-bold text-[#1E90FF] uppercase tracking-wide border-b border-[#1E90FF] pb-1 mb-3">Certifications & Awards</h2>
                {formData.certifications.map((cert, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between font-bold text-slate-900 text-[13px]">
                      <span>{cert.name}</span>
                      <span>{cert.date}</span>
                    </div>
                    {cert.issuer && <div className="text-[12px] text-slate-700">{cert.issuer}</div>}
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Floating Voice Assistant Button & Language Toggle */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end print:hidden">
        {aiMessage && (
          <div className="mb-4 bg-white border border-blue-200 shadow-lg rounded-2xl p-4 max-w-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-blue-500" />
                <span className="font-bold text-sm text-slate-800">AI Assistant</span>
              </div>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-md text-xs">
                <button
                  onClick={() => setVoiceLang("en")}
                  className={`px-2 py-0.5 rounded transition-colors ${voiceLang === "en" ? "bg-white shadow-sm font-bold text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setVoiceLang("hi")}
                  className={`px-2 py-0.5 rounded transition-colors ${voiceLang === "hi" ? "bg-white shadow-sm font-bold text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                >
                  हिं
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-600">{aiMessage}</p>
          </div>
        )}
        <button
          onClick={toggleListening}
          disabled={isProcessingVoice}
          aria-label={isListening ? "Stop Voice Assistant" : "Start Voice Assistant"}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl transition-all ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" :
              isProcessingVoice ? "bg-slate-500 cursor-not-allowed" :
                "bg-blue-600 hover:bg-blue-700 hover:scale-105"
            }`}
        >
          {isProcessingVoice ? (
            <Loader2 size={28} className="text-white animate-spin" />
          ) : isListening ? (
            <MicOff size={28} className="text-white" />
          ) : (
            <Mic size={28} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
