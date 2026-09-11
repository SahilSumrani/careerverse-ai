"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { FileUp, FileText, Loader2 } from "lucide-react";
import { ResumeBuilder, ResumeData } from "./components/ResumeBuilder";

type FlowState = "onboarding" | "upload" | "builder";

export default function CreateResumePage() {
  const [flowState, setFlowState] = useState<FlowState>("onboarding");
  const [isUploading, setIsUploading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to parse resume");
      }

      const data = await res.json();
      if (data.success && data.data) {
        setResumeData(data.data);
        setFlowState("builder");
      } else {
        alert("Could not extract data from the resume. Please start from scratch or try another file.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (flowState === "builder") {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
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
                onClick={() => setFlowState("upload")}
                className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileUp size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">I have a resume</h3>
                <p className="text-slate-600 text-center">
                  Upload your existing resume. We&apos;ll parse it, give you ATS feedback, and let you edit it.
                </p>
              </button>

              <button
                onClick={() => {
                  // Try to load draft from localStorage
                  const draft = localStorage.getItem("cv_resume_draft");
                  if (draft) {
                    try {
                      setResumeData(JSON.parse(draft));
                    } catch (e) {}
                  } else {
                    setResumeData(null);
                  }
                  setFlowState("builder");
                }}
                className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Start from scratch</h3>
                <p className="text-slate-600 text-center">
                  Use our step-by-step ATS-friendly builder to create a brand new resume in minutes.
                </p>
              </button>
            </div>
          </div>
        )}

        {flowState === "upload" && (
          <div className="w-full max-w-xl text-center">
             <h2 className="text-3xl font-bold mb-4">Upload Resume</h2>
             <p className="text-slate-600 mb-8">Upload your PDF or DOCX file to get started.</p>
             <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 bg-white flex flex-col items-center">
               {isUploading ? (
                 <>
                   <Loader2 className="text-blue-500 animate-spin mb-4" size={48} />
                   <p className="text-slate-600 font-medium mb-4">Our AI is parsing your resume... This may take a few seconds.</p>
                 </>
               ) : (
                 <>
                   <FileUp className="text-slate-400 mb-4" size={48} />
                   <p className="text-slate-600 font-medium mb-4">Drag and drop your file here, or click to browse</p>
                   <input type="file" className="hidden" id="resume-upload" accept=".pdf" onChange={handleFileUpload} />
                   <label htmlFor="resume-upload" className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium cursor-pointer hover:bg-blue-700 transition-colors">
                      Select File
                   </label>
                 </>
               )}
             </div>
             <button onClick={() => !isUploading && setFlowState("onboarding")} className={`mt-8 text-blue-600 font-medium ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}>
               &larr; Back
             </button>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
