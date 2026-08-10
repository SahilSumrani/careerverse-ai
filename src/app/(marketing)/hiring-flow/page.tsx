import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hiring flow | CareerVerse AI",
  description: "Track candidates from Applied through Offer with AI scoring, voice interviews, and hiring alerts.",
};

const STAGES = [
  {
    n: "01",
    title: "Applied",
    text: "Inbound resumes land parsed and structured—skills, gaps, and role alignment ready for review.",
  },
  {
    n: "02",
    title: "Screening",
    text: "Explainable AI scores show why a candidate fits, with strengths and gaps hiring managers can trust.",
  },
  {
    n: "03",
    title: "Interview",
    text: "Book voice rounds, capture transcripts, and keep every loop on schedule without spreadsheet chaos.",
  },
  {
    n: "04",
    title: "Offer",
    text: "Push decisions with hiring alerts so the right people act the moment a candidate is ready.",
  },
];

const HIGHLIGHTS = [
  {
    title: "One workspace",
    text: "Parser, scoring, scheduler, and alerts stay connected so recruiters stop bouncing between tabs.",
  },
  {
    title: "Fair by design",
    text: "Every score comes with reasons—never a black-box rank that hiring managers can’t defend.",
  },
  {
    title: "Team-ready alerts",
    text: "Notify Discord (or your channels) when high-score talent applies or finishes a voice screen.",
  },
];

export default function HiringFlowPage() {
  return (
    <>
      <section className="cv-mkt-hero">
        <div className="cv-mkt-hero-inner">
          <div className="cv-eyebrow" style={{ margin: "0 auto" }}>
            <span className="cv-eyebrow-mark">CV</span>
            Hiring flow
          </div>
          <h1>
            From applied to offer—<em>with signal</em>
          </h1>
          <p>
            CareerVerse keeps every stage visible: score talent, run voice interviews, and alert your team when
            it’s time to decide.
          </p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Start Free Trial</span>
            </Link>
            <Link href="/applications" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Open workspace</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="cv-mkt-steps">
        {STAGES.map((stage) => (
          <div key={stage.n} className="cv-mkt-step">
            <strong>{stage.n}</strong>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
          </div>
        ))}
      </div>

      <div className="cv-mkt-grid" style={{ paddingBottom: "3rem" }}>
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="cv-mkt-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <div className="px-5">
        <div className="cv-mkt-band">
          <h2>Ready to run your next role here?</h2>
          <p>Create a workspace, invite recruiters, and move candidates with clear scores at every stage.</p>
          <div className="cv-mkt-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Create workspace</span>
            </Link>
            <Link href="/events" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Book a demo session</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
