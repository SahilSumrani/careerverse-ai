"use client";

import { ResumeData } from "../../types/resume";
import { renderFormattedText } from "../../lib/resume-utils";

interface TemplateProps {
  data: ResumeData;
}

export function AtsClassicTemplate({ data }: TemplateProps) {
  const {
    personalInfo,
    education,
    experience,
    projects,
    skills,
    keyAchievements,
  } = data;

  const cleanUrl = (url?: string) =>
    url?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  // Build skills rows
  const skillRows: Array<{ label: string; items: string[] }> = [];
  if (skills?.languages && skills.languages.length > 0) {
    skillRows.push({ label: "Languages", items: skills.languages });
  }
  if (skills?.frameworks && skills.frameworks.length > 0) {
    skillRows.push({ label: "Technologies & Frameworks", items: skills.frameworks });
  }
  if (skills?.tools && skills.tools.length > 0) {
    skillRows.push({ label: "Developer Tools & Cloud", items: skills.tools });
  }

  return (
    <div className="flex flex-col h-full text-slate-900 leading-normal font-sans text-[11px]">
      {/* Centered ATS Header */}
      <header className="text-center pb-2 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-slate-900 uppercase font-serif mb-1">
          {personalInfo?.fullName || "YOUR NAME"}
        </h1>

        <div className="text-[10.5px] text-slate-800 flex flex-wrap justify-center items-center gap-x-2 font-medium">
          {personalInfo?.phone && <span>{personalInfo.phone}</span>}

          {personalInfo?.email && (
            <>
              {personalInfo?.phone && <span className="text-slate-400">·</span>}
              <a
                href={`mailto:${personalInfo.email}`}
                className="underline hover:text-black"
              >
                {personalInfo.email}
              </a>
            </>
          )}

          {personalInfo?.linkedin && (
            <>
              <span className="text-slate-400">·</span>
              <a
                href={`https://${cleanUrl(personalInfo.linkedin)}`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-black"
              >
                {cleanUrl(personalInfo.linkedin)}
              </a>
            </>
          )}

          {personalInfo?.github && (
            <>
              <span className="text-slate-400">·</span>
              <a
                href={`https://${cleanUrl(personalInfo.github)}`}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-black"
              >
                {cleanUrl(personalInfo.github)}
              </a>
            </>
          )}

          {personalInfo?.location && (
            <>
              <span className="text-slate-400">·</span>
              <span>{personalInfo.location}</span>
            </>
          )}
        </div>
      </header>

      <div className="space-y-2.5 text-slate-900">
        {/* 1. Education */}
        {education && education.length > 0 && (
          <section>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 font-serif">
              Education
            </h2>
            <div className="space-y-1.5">
              {education.map((edu, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-slate-900">
                    <span>{edu.institution}</span>
                    <span className="font-semibold text-slate-800 text-[10.5px]">
                      {edu.startDate} {edu.startDate && edu.endDate && "–"} {edu.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline italic text-[10.5px] text-slate-800">
                    <span>
                      {edu.degree}
                      {edu.score ? ` (GPA / Score: ${edu.score})` : ""}
                    </span>
                    {edu.location && <span>{edu.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Work Experience */}
        {experience && experience.length > 0 && (
          <section>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 font-serif">
              Work Experience
            </h2>
            <div className="space-y-2">
              {experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-slate-900">
                    <span>{exp.company}</span>
                    <span className="font-semibold text-slate-800 text-[10.5px]">
                      {exp.startDate} {exp.startDate && exp.endDate && "–"} {exp.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline italic text-[10.5px] text-slate-800 mb-0.5">
                    <span>{exp.position}</span>
                    {exp.location && <span>{exp.location}</span>}
                  </div>
                  {exp.description && exp.description.length > 0 && (
                    <ul className="list-disc list-outside ml-4 text-[10.5px] text-slate-800 space-y-0.5 leading-snug">
                      {exp.description.map((bullet, j) => (
                        <li key={j}>{renderFormattedText(bullet)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. Projects */}
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 font-serif">
              Projects
            </h2>
            <div className="space-y-2">
              {projects.map((proj, i) => (
                <div key={i}>
                  <div className="flex justify-between items-baseline font-bold text-[11px] text-slate-900">
                    <span>
                      {proj.name}
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="font-normal italic text-slate-700 ml-1.5 text-[10.5px]">
                          | {proj.technologies.join(", ")}
                        </span>
                      )}
                    </span>
                    {proj.link && (
                      <a
                        href={proj.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-700 underline font-normal hover:text-black"
                      >
                        {cleanUrl(proj.link)}
                      </a>
                    )}
                  </div>
                  {proj.description && proj.description.length > 0 && (
                    <ul className="list-disc list-outside ml-4 text-[10.5px] text-slate-800 space-y-0.5 leading-snug mt-0.5">
                      {proj.description.map((bullet, j) => (
                        <li key={j}>{renderFormattedText(bullet)}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Technical Skills */}
        {skillRows.length > 0 && (
          <section>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 font-serif">
              Technical Skills
            </h2>
            <div className="space-y-0.5 text-[10.5px] text-slate-800 leading-snug">
              {skillRows.map((row, i) => (
                <p key={i}>
                  <strong className="font-bold text-slate-900">{row.label}:</strong>{" "}
                  {row.items.join(", ")}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* 5. Key Achievements */}
        {keyAchievements && keyAchievements.length > 0 && (
          <section>
            <h2 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-0.5 mb-1.5 font-serif">
              Achievements
            </h2>
            <ul className="list-disc list-outside ml-4 text-[10.5px] text-slate-800 space-y-0.5 leading-snug">
              {keyAchievements.map((ach, i) => (
                <li key={i}>
                  <strong className="font-bold text-slate-900">{ach.title}</strong>
                  {ach.description ? `: ${renderFormattedText(ach.description)}` : ""}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Watermark print:hidden */}
      <footer className="mt-auto pt-3 text-right text-[9px] text-slate-400 print:hidden select-none">
        Powered by CareerVerse AI
      </footer>
    </div>
  );
}
