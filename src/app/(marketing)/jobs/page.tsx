import Link from "next/link";
import type { Metadata } from "next";
import { DUMMY_JOBS } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Jobs | CareerVerse AI",
  description:
    "Browse dummy and featured job listings for students and early-career talent on CareerVerse AI.",
};

export default function JobsMarketingPage() {
  return (
    <>
      <section className="cv-mkt-hero">
        <div className="cv-mkt-hero-inner">
          <div className="cv-eyebrow" style={{ margin: "0 auto" }}>
            <span className="cv-eyebrow-mark">CV</span>
            Jobs for students &amp; early talent
          </div>
          <h1>
            Find roles that fit <em>your path</em>
          </h1>
          <p>
            Sample job listings across engineering, recruiting, analytics, and design. Sign in to unlock
            explainable match scores, applications tracking, and personalized roadmaps.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Create free account</span>
            </Link>
            <Link href="/opportunities/browse" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Browse live listings</span>
            </Link>
            <Link href="/opportunities" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">All opportunities</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="cv-mkt-grid">
        {DUMMY_JOBS.map((job) => (
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
          <h2>Ready to apply with a real profile?</h2>
          <p>
            Upload your resume, get AI career intelligence, and track applications from Applied to Offer.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Start Free Trial</span>
            </Link>
            <Link href="/opportunities/browse" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Open job board</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
