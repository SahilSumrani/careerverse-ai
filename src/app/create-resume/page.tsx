"use client";

import { useState, useRef } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FileUp, FileText, Loader2, AlertCircle } from "lucide-react";
import { ResumeBuilder, ResumeData } from "./components/ResumeBuilder";

type FlowState = "onboarding" | "upload" | "builder";

export default function CreateResumePage() {
  const [flowState, setFlowState] = useState<FlowState>("onboarding");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";

    if (!isPdf) {
      setUploadError("Please upload a valid PDF (.pdf) file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit. Please upload a smaller file.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume");
      }

      if (data.success && data.data) {
        setResumeData(data.data);
        setFlowState("builder");
      } else {
        setUploadError(data.error || "Could not extract data from the resume. Please try another file or start from scratch.");
      }
    } catch (error: any) {
      console.error("Resume upload error:", error);
      setUploadError(error.message || "An error occurred while parsing your resume. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (flowState === "builder") {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="print:hidden">
          <SiteHeader />
        </div>
        <ResumeBuilder initialData={resumeData} onBack={() => setFlowState("onboarding")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {flowState === "onboarding" && (
          <div className="max-w-3xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Let&apos;s get you hired.
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Do you already have a resume, or do you want to start from scratch?
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <button
                onClick={() => {
                  setUploadError(null);
                  setFlowState("upload");
                }}
                className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileUp size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">I have a resume</h3>
                <p className="text-slate-600 text-center">
                  Upload your existing PDF resume. We&apos;ll parse it, format it in executive or classic layout, and let you edit it.
                </p>
              </button>

              <button
                onClick={() => {
                  const draft = localStorage.getItem("cv_resume_draft");
                  if (draft) {
                    try {
                      setResumeData(JSON.parse(draft));
                    } catch (e) {
                      console.error("Failed to parse draft", e);
                    }
                  } else {
                    setResumeData(null);
                  }
                  setFlowState("builder");
                }}
                className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left cursor-pointer"
              >
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Start from scratch</h3>
                <p className="text-slate-600 text-center">
                  Use our step-by-step ATS-friendly builder to create a brand new resume in minutes with dual templates.
                </p>
              </button>
            </div>
          </div>
        )}

        {flowState === "upload" && (
          <div className="w-full max-w-xl text-center">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Upload Resume</h2>
            <p className="text-slate-600 mb-8">Upload your PDF file to get started.</p>

            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 bg-white flex flex-col items-center transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                  : "border-slate-300 hover:border-slate-400"
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="text-blue-600 animate-spin mb-4" size={48} />
                  <p className="text-slate-800 font-semibold mb-2">Parsing your resume with AI...</p>
                  <p className="text-slate-500 text-sm">
                    Extracting work experience, education, skills, and achievements.
                  </p>
                </>
              ) : (
                <>
                  <div className={`p-4 rounded-full mb-4 ${isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}>
                    <FileUp size={40} />
                  </div>
                  <p className="text-slate-700 font-medium mb-2">
                    {isDragging ? "Drop your PDF file here" : "Drag and drop your PDF here, or click to browse"}
                  </p>
                  <p className="text-xs text-slate-400 mb-6">Supports PDF up to 5MB</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    id="resume-upload"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="bg-blue-600 text-white px-8 py-3 rounded-full font-medium cursor-pointer hover:bg-blue-700 transition-colors shadow-sm hover:shadow"
                  >
                    Select PDF
                  </label>
                </>
              )}
            </div>

            {uploadError && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-left">
                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                <div className="flex-1 text-sm text-red-700">
                  <p className="font-semibold">Upload failed</p>
                  <p className="mt-0.5">{uploadError}</p>
                  <button
                    onClick={() => {
                      setResumeData(null);
                      setFlowState("builder");
                    }}
                    className="mt-2 text-xs font-semibold text-red-800 underline hover:no-underline"
                  >
                    Or continue to builder from scratch &rarr;
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => !isUploading && setFlowState("onboarding")}
              className={`mt-8 text-blue-600 font-medium ${
                isUploading ? "opacity-50 cursor-not-allowed" : "hover:underline"
              }`}
            >
              &larr; Back
            </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
