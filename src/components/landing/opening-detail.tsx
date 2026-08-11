import Link from "next/link";
import {
  MapPin,
  IndianRupee,
  Building2,
  Briefcase,
  ArrowLeft,
  MonitorSmartphone,
} from "lucide-react";
import type { DummyJob } from "@/data/jobs";
import "./opening-detail.css";

type Props = {
  job: DummyJob;
  kind: "jobs" | "internships";
};

export function OpeningDetail({ job, kind }: Props) {
  const backHref = kind === "internships" ? "/internships" : "/jobs";
  const backLabel = kind === "internships" ? "Back to internships" : "Back to jobs";
  const payLabel = kind === "internships" || job.type === "Internship" || job.type === "Apprenticeship"
    ? "Stipend"
    : "Salary";

  return (
    <div className="cv-open">
      <div className="cv-open-inner">
        <Link href={backHref} className="cv-open-back">
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>

        <article className="cv-open-card">
          <header className="cv-open-head">
            <div className="cv-open-badges">
              <span className={`cv-open-type ${kind === "internships" ? "is-intern" : ""}`}>
                {job.type}
              </span>
              <span className="cv-open-mode">{job.workMode}</span>
            </div>
            <h1>{job.title}</h1>
            <p className="cv-open-company">
              <Building2 size={16} aria-hidden />
              {job.company}
            </p>
          </header>

          <ul className="cv-open-facts">
            <li>
              <MapPin size={16} aria-hidden />
              <div>
                <span>Location</span>
                <strong>{job.location}</strong>
              </div>
            </li>
            <li>
              <IndianRupee size={16} aria-hidden />
              <div>
                <span>{payLabel}</span>
                <strong>{job.salary}</strong>
              </div>
            </li>
            <li>
              <MonitorSmartphone size={16} aria-hidden />
              <div>
                <span>Work mode</span>
                <strong>{job.workMode}</strong>
              </div>
            </li>
            <li>
              <Briefcase size={16} aria-hidden />
              <div>
                <span>Opening type</span>
                <strong>{job.type}</strong>
              </div>
            </li>
          </ul>

          <section className="cv-open-section">
            <h2>About the {kind === "internships" ? "internship" : "role"}</h2>
            <p>{job.blurb}</p>
            <p className="cv-open-extra">
              CareerVerse AI helps you match this opening with your profile, tailor your resume, and track
              applications through every stage of the hiring flow.
            </p>
          </section>

          <section className="cv-open-section">
            <h2>Skills & tags</h2>
            <div className="cv-open-tags">
              {job.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>

          <div className="cv-open-cta">
            <Link href="/auth/signup" className="cv-open-apply">
              Apply now
            </Link>
            <Link href="/auth/signin" className="cv-open-secondary">
              Sign in to track
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
