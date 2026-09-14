"use client";

import { ExternalLink } from "lucide-react";
import { ResumeData } from "../../types/resume";
import { renderFormattedText } from "../../lib/resume-utils";

interface TemplateProps {
  data: ResumeData;
}

export function ExecutiveTemplate({ data }: TemplateProps) {
  const { personalInfo, professionalSummary, experience, projects, keyAchievements, skills, education, trainingCourses, languages } = data;

  return (
    <div className="flex flex-col h-full text-slate-900 leading-normal">
      {/* Header */}
      <header className="border-b-2 border-slate-900 pb-2.5 mb-3.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-slate-900 mb-0.5">
          {personalInfo?.fullName || "YOUR NAME"}
        </h1>
        {personalInfo?.headline && (
          <p className="text-xs md:text-[13px] font-bold text-sky-700 tracking-wide mb-1.5">
            {personalInfo.headline}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-700 font-medium">
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

      {/* 2-Column Grid */}
      <div className="grid grid-cols-12 gap-5 flex-1">
        {/* Left Column (60%) */}
        <div className="col-span-7 space-y-3">
          {professionalSummary && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Summary
              </h2>
              <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify">
                {renderFormattedText(professionalSummary)}
              </p>
            </section>
          )}

          {experience && experience.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Experience
              </h2>
              <div className="space-y-2.5">
                {experience.map((exp, i) => (
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

          {projects && projects.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Key Projects
              </h2>
              <div className="space-y-2">
                {projects.map((proj, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-1 font-bold text-[12px] text-slate-900">
                      <span>{proj.name}</span>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open link for ${proj.name}`}
                          className="text-sky-600 inline-block"
                        >
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
          {keyAchievements && keyAchievements.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Key Achievements
              </h2>
              <div className="space-y-1.5">
                {keyAchievements.map((ach, i) => (
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

          {(skills?.languages?.length > 0 ||
            skills?.frameworks?.length > 0 ||
            skills?.tools?.length > 0) && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Skills
              </h2>
              <div className="flex flex-wrap gap-1">
                {[
                  ...(skills?.languages || []),
                  ...(skills?.frameworks || []),
                  ...(skills?.tools || []),
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

          {education && education.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Education
              </h2>
              <div className="space-y-1.5">
                {education.map((edu, i) => (
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

          {trainingCourses && trainingCourses.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Training / Courses
              </h2>
              <div className="space-y-1.5">
                {trainingCourses.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-baseline justify-between text-[11px] font-bold text-slate-900 leading-tight">
                      <span>{c.name}</span>
                      {c.durationYears && (
                        <span className="text-[9.5px] font-semibold text-sky-700">
                          {c.durationYears} {c.durationYears.includes("Year") || c.durationYears.includes("Month") ? "" : "Yr"}
                        </span>
                      )}
                    </div>
                    {c.issuer && (
                      <p className="text-[10px] text-slate-600 font-medium">
                        {c.issuer} {c.year ? `(${c.year})` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {languages && languages.length > 0 && (
            <section>
              <h2 className="text-[11.5px] font-extrabold uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-0.5 mb-1.5">
                Languages
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
