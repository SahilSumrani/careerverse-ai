import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Opportunities | CareerVerse AI",
  description: "Explore roles, internships, and hiring programs with explainable CareerVerse match scores.",
};

const OPPORTUNITIES = [
  {
    title: "Product Engineer",
    org: "Northstar Labs",
    type: "Full-time · Remote",
    blurb: "Ship candidate scoring surfaces and recruiter workflows used by high-volume hiring teams.",
  },
  {
    title: "Campus Recruiter",
    org: "BrightPath",
    type: "Full-time · Hybrid",
    blurb: "Run explainable screens across universities and keep silver medalists warm for next season.",
  },
  {
    title: "People Ops Intern",
    org: "Harbor Collective",
    type: "Internship · On-site",
    blurb: "Support interview scheduling, score reviews, and hiring alerts for a growing product org.",
  },
  {
    title: "Talent Sourcer",
    org: "Cascade Health",
    type: "Contract · Remote",
    blurb: "Build shortlists with Magic AI Search and hand recruiters clear fit reasons—not black-box ranks.",
  },
  {
    title: "Hiring Manager Fellowship",
    org: "CareerVerse Partner Network",
    type: "Program · Virtual",
    blurb: "A guided program for managers who want fairer interviews and faster offer decisions.",
  },
  {
    title: "Recruiting Ops Lead",
    org: "Orbit Finance",
    type: "Full-time · Hybrid",
    blurb: "Own stage health from Applied to Offer across multiple open roles and interview loops.",
  },
];

export default function OpportunitiesMarketingPage() {
  return (
    <>
      <section className="cv-mkt-hero">
        <div className="cv-mkt-hero-inner">
          <div className="cv-eyebrow" style={{ margin: "0 auto" }}>
            <span className="cv-eyebrow-mark">CV</span>
            Opportunities
          </div>
          <h1>
            Roles worth <em>your attention</em>
          </h1>
          <p>
            Browse jobs, internships, and hiring programs. Sign in for explainable match scores tied to your
            profile—not opaque rankings.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Get match scores</span>
            </Link>
            <Link href="/auth/signin" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Sign in</span>
            </Link>
            <Link href="/opportunities/browse" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Browse listings</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="cv-mkt-grid">
        {OPPORTUNITIES.map((item) => (
          <article key={item.title + item.org} className="cv-mkt-card">
            <h3>{item.title}</h3>
            <p>
              {item.org} · {item.type}
            </p>
            <p>{item.blurb}</p>
            <span className="cv-mkt-meta">CareerVerse featured</span>
          </article>
        ))}
      </div>

      <div className="px-5">
        <div className="cv-mkt-band">
          <h2>Hiring for these roles?</h2>
          <p>Parse resumes, score talent, and move candidates through every stage in one recruiting OS.</p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Start Free Trial</span>
            </Link>
            <Link href="/hiring-flow" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">See hiring flow</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
