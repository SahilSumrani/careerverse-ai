import Link from "next/link";
import type { Metadata } from "next";
import { getHomeInternships, INTERNSHIP_FILTER_CHIPS } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Internships | CareerVerse AI",
  description:
    "Browse student internships and apprenticeships on CareerVerse AI—remote, hybrid, and on-site roles with stipends.",
};

export default function InternshipsMarketingPage() {
  const internships = getHomeInternships(20);

  return (
    <>
      <section className="cv-mkt-hero">
        <div className="cv-mkt-hero-inner">
          <div className="cv-eyebrow" style={{ margin: "0 auto" }}>
            <span className="cv-eyebrow-mark">CV</span>
            Internships for students
          </div>
          <h1>
            Find internships that <em>build your career</em>
          </h1>
          <p>
            Paid and mentored internships across engineering, design, marketing, and data. Sign in to match
            with explainable AI scores and track every application.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Create free account</span>
            </Link>
            <Link href="/jobs" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Browse fresher jobs</span>
            </Link>
          </div>
          <div className="cv-mkt-tags" style={{ justifyContent: "center", marginTop: "1.25rem" }}>
            {INTERNSHIP_FILTER_CHIPS.map((chip) => (
              <span key={chip} className="cv-mkt-tag">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="cv-mkt-grid">
        {internships.map((job) => (
          <article key={job.id} className="cv-mkt-card">
            <h3>{job.title}</h3>
            <p>
              {job.company} · {job.location}
            </p>
            <p>
              {job.type} · {job.workMode} · {job.salary}
            </p>
            <p>{job.blurb}</p>
            <div className="cv-mkt-tags">
              {job.tags.map((tag) => (
                <span key={tag} className="cv-mkt-tag">
                  {tag}
                </span>
              ))}
            </div>
            <span className="cv-mkt-meta">CareerVerse sample listing</span>
          </article>
        ))}
      </div>

      <div className="px-5">
        <div className="cv-mkt-band">
          <h2>Empower your career with CareerVerse today</h2>
          <p>
            Upload your resume once, get AI career intelligence, and apply to internships that fit your skills.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Get started free</span>
            </Link>
            <Link href="/jobs" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">See jobs</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
