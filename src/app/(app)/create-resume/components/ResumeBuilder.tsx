"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Download,
  Save,
  Check,
  Layout,
  LogIn,
  FileType,
  FileText,
  Sparkles,
} from "lucide-react";

import { ResumeData, ActiveTab } from "../types/resume";
import {
  SAMPLE_DATA,
  getStarterResume,
  getResumeSuggestions,
  stripEmojisFromObject,
  getResumeStorageKey,
} from "../lib/resume-utils";

import { PersonalInfoForm } from "./sections/PersonalInfoForm";
import { SummaryForm } from "./sections/SummaryForm";
import { ExperienceForm } from "./sections/ExperienceForm";
import { ProjectsForm } from "./sections/ProjectsForm";
import { EducationForm } from "./sections/EducationForm";
import { SkillsForm } from "./sections/SkillsForm";
import { AchievementsForm } from "./sections/AchievementsForm";
import { CoursesForm } from "./sections/CoursesForm";

import { ResumePreview } from "./templates/ResumePreview";
import { VoiceAssistant } from "./VoiceAssistant";
import { ConfirmModal, ToastBanner } from "./ConfirmModal";

export type { ResumeData } from "../types/resume";

interface ResumeBuilderProps {
  initialData?: ResumeData | null;
  onBack?: () => void;
}

export function ResumeBuilder({ initialData, onBack }: ResumeBuilderProps) {
  const { data: session } = useSession();

  // Layout & view states
  const [currentTemplate, setCurrentTemplate] = useState<"executive" | "classic" | "ats-classic">("executive");
  const [activeTab, setActiveTab] = useState<ActiveTab | "personal">("personal");
  const [zoom, setZoom] = useState<number>(75);
  const [resumeFontSize, setResumeFontSize] = useState<"compact" | "standard" | "large">("standard");
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  // Async action status
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modal confirmation dialogs
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
    variant?: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: () => {},
  });

  const previewRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);

  // Derive isolated guest or user-scoped storage key
  const storageKey = useMemo(() => getResumeStorageKey(session?.user?.id), [session?.user?.id]);

  const defaultStarter = useMemo(() => getStarterResume(session?.user), [session?.user]);

  const { register, control, reset, getValues, setValue, watch } = useForm<ResumeData>({
    defaultValues: initialData || defaultStarter,
  });

  // Keep template state in sync
  const handleTemplateChange = (t: "executive" | "classic" | "ats-classic") => {
    setCurrentTemplate(t);
    setValue("templateId", t);
  };

  // -------------------------------------------------------------
  // PRIORITY #1 FIX: Consolidated Data Loading Effect
  // Strict precedence: initialData > server database resume > local draft
  // Guarded by isInitializedRef to prevent slow server fetches from overwriting user typing
  // -------------------------------------------------------------
  useEffect(() => {
    if (isInitializedRef.current) return;

    let active = true;

    async function loadResumeData() {
      // 1. If explicit initialData was passed (e.g. from resume upload parser)
      if (initialData && Object.keys(initialData).length > 0) {
        if (active) {
          reset(initialData);
          if (initialData.templateId) setCurrentTemplate(initialData.templateId);
          isInitializedRef.current = true;
        }
        return;
      }

      // 2. If user is authenticated, query the server first
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/resume/save");
          if (res.ok) {
            const data = await res.json();
            if (active && data?.resume?.resumeData) {
              const serverData = stripEmojisFromObject(data.resume.resumeData);
              reset(serverData);
              if (data.resume.templateId) {
                setCurrentTemplate(data.resume.templateId);
              }
              // Clean up any guest drafts on sign-in
              try {
                localStorage.removeItem("cv_resume_draft_guest");
              } catch {}
              isInitializedRef.current = true;
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch server resume:", err);
        }
      }

      // 3. Fallback: check localStorage draft
      if (typeof window !== "undefined") {
        try {
          const localDraft = localStorage.getItem(storageKey);
          if (localDraft) {
            const parsed = JSON.parse(localDraft);
            if (active && parsed && typeof parsed === "object") {
              const cleanLocal = stripEmojisFromObject(parsed);
              reset(cleanLocal);
              if (cleanLocal.templateId) {
                setCurrentTemplate(cleanLocal.templateId);
              }
              isInitializedRef.current = true;
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to load local draft:", err);
        }
      }

      // 4. Default blank starter if nothing exists
      if (active) {
        reset(defaultStarter);
        isInitializedRef.current = true;
      }
    }

    loadResumeData();

    return () => {
      active = false;
    };
  }, [initialData, session?.user?.id, storageKey, reset, defaultStarter]);

  // Debounced auto-save to localStorage & Cloud
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const subscription = watch((val) => {
      if (!isInitializedRef.current) return;
      
      const currentValues = getValues();
      
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKey, JSON.stringify(currentValues));
        } catch {}
      }

      if (session?.user?.id) {
        setSaveStatus("Saving...");
        clearTimeout(timeout);
        timeout = setTimeout(async () => {
          try {
            const res = await fetch("/api/resume/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                resumeData: currentValues,
                templateId: currentTemplate,
                title: `${currentValues.personalInfo?.fullName || "My"} Resume`,
              }),
            });
            if (res.ok) {
              setSaveStatus("Auto-saved");
              setTimeout(() => setSaveStatus(null), 2500);
            } else {
              setSaveStatus(null);
            }
          } catch (e) {
            console.error("Auto-save failed", e);
            setSaveStatus(null);
          }
        }, 3000);
      }
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [watch, storageKey, session?.user?.id, currentTemplate, getValues]);

  // Real-time suggestions (debounced watch)
  const [liveSuggestions, setLiveSuggestions] = useState<string[]>([]);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const current = getValues();
      setLiveSuggestions(getResumeSuggestions(current));
    }, 400);
    return () => clearTimeout(timeout);
  });

  // Save to account
  const handleSaveToAccount = async () => {
    if (!session?.user) {
      setToastMessage({
        text: "Please sign in to save your resume to your account.",
        type: "info",
      });
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
      setSaveStatus("Saved!");
      setToastMessage({ text: "Resume saved to your account!", type: "success" });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setToastMessage({
        text: err.message || "Failed to save resume. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF via native print with cross-browser styling
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

  // Load sample data with confirmation dialog
  const promptLoadSample = () => {
    setConfirmModal({
      isOpen: true,
      title: "Load Sample Resume?",
      message: "This will populate the builder with an ATS-friendly sample profile. Any unsaved edits will be replaced.",
      variant: "warning",
      action: () => {
        reset(SAMPLE_DATA);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setToastMessage({ text: "Sample resume loaded successfully.", type: "info" });
      },
    });
  };

  // Reset/Clear resume
  const promptClearResume = () => {
    setConfirmModal({
      isOpen: true,
      title: "Clear Resume?",
      message: "Are you sure you want to clear all fields and start over with a blank template?",
      variant: "danger",
      action: () => {
        reset(defaultStarter);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setToastMessage({ text: "Resume reset to blank state.", type: "info" });
      },
    });
  };

  // Direct updater callback for VoiceAssistant
  const handleUpdateResume = useCallback((updated: ResumeData) => {
    reset(updated);
  }, [reset]);

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-100 print:h-auto print:overflow-visible print:block">
      {/* Embedded Print CSS ensuring exact A4 sizing across all browsers */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #resume-print-area {
            box-shadow: none !important;
            transform: none !important;
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* Mobile Top View Switcher (Edit vs Preview) */}
      <div className="flex md:hidden items-center justify-between p-2 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-2xs print:hidden">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Go back to options"
            className="text-slate-600 text-xs font-semibold px-2 py-1 flex items-center gap-1 cursor-pointer"
          >
            &larr; Back
          </button>
        )}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            aria-label="Switch to Edit Form"
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
            aria-label="Switch to Preview PDF"
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
          aria-label="Download PDF"
          className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1 cursor-pointer"
        >
          <Download size={12} /> PDF
        </button>
      </div>

      {/* LEFT: Editor Panel */}
      <div
        className={`w-full md:w-[45%] lg:w-[42%] h-full flex flex-col border-r border-slate-200 bg-white print:hidden shrink-0 shadow-sm ${
          mobileTab === "edit" ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Top bar with back, sample buttons, template picker, and save/export buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                aria-label="Back to selection"
                className="hidden md:flex items-center text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                &larr; Back
              </button>
            )}
            <button
              type="button"
              onClick={promptLoadSample}
              aria-label="Load sample resume content"
              className="text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-200/60 cursor-pointer"
            >
              Demo Example
            </button>
            <button
              type="button"
              onClick={promptClearResume}
              aria-label="Clear all fields"
              className="text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors px-1.5 py-1 rounded hover:bg-red-50 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSaveToAccount}
              disabled={isSaving}
              aria-label={session?.user ? "Save resume to account" : "Sign in to save"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors shadow-xs cursor-pointer ${
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
              aria-label="Export resume to PDF"
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
              aria-label={`Open ${tab.label} section`}
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
          {activeTab === "personal" && <PersonalInfoForm register={register} />}
          {activeTab === "summary" && <SummaryForm register={register} />}
          {activeTab === "experience" && <ExperienceForm register={register} control={control} />}
          {activeTab === "projects" && <ProjectsForm register={register} control={control} />}
          {activeTab === "education" && <EducationForm register={register} control={control} />}
          {activeTab === "skills" && <SkillsForm control={control} />}
          {activeTab === "achievements" && <AchievementsForm register={register} control={control} />}
          {activeTab === "courses" && <CoursesForm register={register} control={control} />}
        </div>
      </div>

      {/* RIGHT: Live Preview Panel */}
      <div
        className={`flex-1 overflow-auto p-2 sm:p-3 md:p-6 bg-slate-200/90 print:bg-white flex flex-col items-center hide-scrollbar print:overflow-visible print:h-auto print:p-0 print:block ${
          mobileTab === "preview" ? "flex" : "hidden md:flex"
        }`}
      >
        {/* Controls Bar: Template switcher + Zoom + Font Size */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs print:hidden shrink-0 w-full max-w-[794px]">
          {/* Template Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleTemplateChange("executive")}
              aria-label="Executive 2-column template"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentTemplate === "executive"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layout size={13} />
              <span>Executive (2-Col)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange("classic")}
              aria-label="Classic 1-column template"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentTemplate === "classic"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileType size={13} />
              <span>Classic (1-Col)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTemplateChange("ats-classic")}
              aria-label="ATS Classic single-column template"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                currentTemplate === "ats-classic"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText size={13} />
              <span>ATS Classic</span>
            </button>
          </div>

          {/* Zoom & Font Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 font-medium">Zoom:</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(35, z - 5))}
                aria-label="Zoom out"
                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-bold text-slate-800 min-w-[36px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(120, z + 5))}
                aria-label="Zoom in"
                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const screenW = window.innerWidth;
                    const targetPercent =
                      screenW < 768
                        ? Math.max(38, Math.floor(((screenW - 24) / 794) * 100))
                        : Math.min(95, Math.floor(((screenW * 0.52) / 794) * 100));
                    setZoom(targetPercent);
                  }
                }}
                aria-label="Fit screen zoom"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors cursor-pointer ml-1"
              >
                Fit Screen
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-1 border-l border-slate-200 pl-2 text-xs">
              <span className="text-slate-500 font-medium">Font:</span>
              {(["compact", "standard", "large"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setResumeFontSize(size)}
                  aria-label={`Set font size to ${size}`}
                  className={`text-[11px] font-semibold px-1.5 py-0.5 rounded capitalize transition-colors cursor-pointer ${
                    resumeFontSize === size
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Memoized Isolated Preview: typing does NOT re-render the left panel */}
        <ResumePreview
          control={control}
          templateId={currentTemplate}
          zoom={zoom}
          fontSize={resumeFontSize}
          previewRef={previewRef}
        />
      </div>

      {/* Floating AI Voice Assistant */}
      <VoiceAssistant
        getResumeState={getValues}
        onUpdateResume={handleUpdateResume}
        liveSuggestions={liveSuggestions}
      />

      {/* Custom Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.action}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modern Toast Notification */}
      <ToastBanner
        message={toastMessage?.text || null}
        type={toastMessage?.type}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
