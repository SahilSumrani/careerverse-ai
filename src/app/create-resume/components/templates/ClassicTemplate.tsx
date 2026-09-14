"use client";

import { ResumeData } from "../../types/resume";
import { renderFormattedText } from "../../lib/resume-utils";

interface TemplateProps {
  data: ResumeData;
}

export function ClassicTemplate({ data }: TemplateProps) {
  const { personalInfo, professionalSummary, experience, projects, skills, trainingCourses, education, keyAchievements, languages } = data;

  return (
    <div className="flex flex-col h-full text-slate-900 leading-normal font-sans">
      {/* Centered Classic Header */}
      <header className="text-center pb-3 mb-3 border-b border-slate-300">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-1 font-serif">
          {personalInfo?.fullName || "YOUR NAME"}
        </h1>
        {personalInfo?.headline && (
          <p className="text-xs md:text-[12.5px] font-semibold text-slate-700 tracking-wide mb-1.5">
            {personalInfo.headline}
          </p>
        )}
        <div className="text-[11px] text-slate-600 flex flex-wrap justify-center gap-x-3 gap-y-0.5 font-medium">
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}
          {personalInfo?.email && (
            <span>{personalInfo?.phone ? " • " : ""}{personalInfo.email}</span>
          )}
          {personalInfo?.linkedin && (
            <span> • {personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
          )}
          {personalInfo?.location && <span> • {personalInfo.location}</span>}
        </div>
      </header>

      <div className="space-y-3 text-slate-800">
        {/* Summary */}
        {professionalSummary && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
              Summary
            </h2>
            <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify">
              {renderFormattedText(professionalSummary)}
            </p>
          </section>
        )}

        {/* Experience */}
        {experience && experience.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
              Experience
            </h2>
            <div className="space-y-2">
              {experience.map((exp, i) => (
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
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
              Projects
            </h2>
            <div className="space-y-2">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-[11.5px]">{proj.name}</span>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-600 hover:underline"
                      >
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
        {(skills?.languages?.length > 0 ||
          skills?.frameworks?.length > 0 ||
          skills?.tools?.length > 0) && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
              Skills
            </h2>
            <p className="text-[11px] text-slate-800 text-center font-medium leading-relaxed">
              {[
                ...(skills?.languages || []),
                ...(skills?.frameworks || []),
                ...(skills?.tools || []),
              ].join(" • ")}
            </p>
          </section>
        )}

        {/* Training / Courses with Duration */}
        {trainingCourses && trainingCourses.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
              Training / Courses
            </h2>
            <div className="space-y-1">
              {trainingCourses.map((c, i) => (
                <div key={i} className="text-[10.5px] text-slate-800 leading-snug">
                  <span className="font-bold text-slate-900">{c.name}</span>
                  {c.durationYears && <span className="font-medium text-sky-700"> ({c.durationYears})</span>}
                  {c.issuer && <span className="text-slate-600"> — {c.issuer}</span>}
                  {c.year && <span className="text-slate-500"> ({c.year})</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education && education.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
              Education
            </h2>
            <div className="space-y-1">
              {education.map((edu, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900 text-[11.5px]">{edu.institution}</span>
                    {edu.location && (
                      <span className="text-[10px] text-slate-600">{edu.location}</span>
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

        {/* Spoken Languages */}
        {languages && languages.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1 text-center font-serif">
              Languages
            </h2>
            <p className="text-[11px] text-slate-800 text-center font-medium">
              {languages.join(" • ")}
            </p>
          </section>
        )}

        {/* Key Achievements: 3-column bottom grid */}
        {keyAchievements && keyAchievements.length > 0 && (
          <section className="pt-1">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-0.5 mb-1.5 text-center font-serif">
              Key Achievements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {keyAchievements.slice(0, 3).map((ach, i) => (
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
  );
}
