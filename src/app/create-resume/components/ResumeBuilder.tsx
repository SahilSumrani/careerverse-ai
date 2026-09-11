"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

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
}

export function ResumeBuilder({
  initialData,
  onBack,
}: {
  initialData?: ResumeData | null;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"personal" | "education" | "experience" | "projects" | "skills">("personal");

  const defaultValues: ResumeData = initialData || {
    personalInfo: { fullName: "", email: "", phone: "", linkedin: "", github: "" },
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], tools: [] },
  };

  const { register, control, watch, formState: { errors } } = useForm<ResumeData>({
    defaultValues,
  });

  const formData = watch();

  // We could save formData to localStorage here on change
  useEffect(() => {
    localStorage.setItem("cv_resume_draft", JSON.stringify(formData));
  }, [formData]);

  return (
    <div className="w-full flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
      {/* LEFT: Editor */}
      <div className="w-full md:w-1/2 h-full flex flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
           <button onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium">
             &larr; Back
           </button>
           <h2 className="font-bold text-lg text-slate-800">Editor</h2>
           <div className="w-16"></div>
        </div>
        
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 hide-scrollbar">
          {(["personal", "education", "experience", "projects", "skills"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
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
           {/* We will add other tabs (Education, Experience, etc.) in a fuller implementation */}
           {activeTab !== "personal" && (
             <div className="text-slate-500 italic mt-8 text-center">
               This section ({activeTab}) will contain dynamic fields to add multiple items using react-hook-form field arrays.
             </div>
           )}
        </div>
      </div>

      {/* RIGHT: Live Preview */}
      <div className="w-full md:w-1/2 h-full bg-slate-100 p-8 overflow-y-auto flex items-start justify-center">
        {/* A4 Paper style preview */}
        <div className="bg-white shadow-lg w-[210mm] min-h-[297mm] p-[10mm] print:w-auto print:shadow-none print:m-0">
           <header className="text-center border-b-2 border-slate-900 pb-4 mb-4">
              <h1 className="text-3xl font-bold uppercase tracking-wider text-slate-900">{formData.personalInfo.fullName || "YOUR NAME"}</h1>
              <div className="text-sm text-slate-600 mt-2 space-x-2">
                 <span>{formData.personalInfo.email || "email@example.com"}</span>
                 <span>|</span>
                 <span>{formData.personalInfo.phone || "(123) 456-7890"}</span>
                 {formData.personalInfo.linkedin && (
                   <>
                     <span>|</span>
                     <span>{formData.personalInfo.linkedin}</span>
                   </>
                 )}
                 {formData.personalInfo.github && (
                   <>
                     <span>|</span>
                     <span>{formData.personalInfo.github}</span>
                   </>
                 )}
              </div>
           </header>

           {formData.experience.length > 0 && (
             <section className="mb-4">
               <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide border-b border-slate-300 mb-2">Experience</h2>
               {formData.experience.map((exp, i) => (
                 <div key={i} className="mb-3">
                   <div className="flex justify-between font-bold">
                     <span>{exp.position} at {exp.company}</span>
                     <span>{exp.startDate} - {exp.endDate}</span>
                   </div>
                   <ul className="list-disc list-outside ml-4 mt-1 text-sm text-slate-700">
                     {exp.description.map((desc, j) => (
                       <li key={j}>{desc}</li>
                     ))}
                   </ul>
                 </div>
               ))}
             </section>
           )}

           {formData.projects.length > 0 && (
             <section className="mb-4">
               <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide border-b border-slate-300 mb-2">Projects</h2>
               {formData.projects.map((proj, i) => (
                 <div key={i} className="mb-3">
                   <div className="font-bold">{proj.name} | <span className="font-normal italic text-slate-600">{proj.technologies.join(", ")}</span></div>
                   <ul className="list-disc list-outside ml-4 mt-1 text-sm text-slate-700">
                     {proj.description.map((desc, j) => (
                       <li key={j}>{desc}</li>
                     ))}
                   </ul>
                 </div>
               ))}
             </section>
           )}
        </div>
      </div>
    </div>
  );
}
