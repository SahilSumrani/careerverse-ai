import Link from "next/link";
import { ArrowRight, Library, Workflow } from "lucide-react";
import "./home-feature-strip.css";

export function HomeFeatureStrip() {
  return (
    <section className="cv-strip">
      <div className="cv-container cv-strip-grid">
        <article className="cv-strip-card">
          <span className="cv-strip-icon">
            <Library size={22} aria-hidden />
          </span>
          <h3>Your talent bank</h3>
          <p>Search candidates by skills, location, AI scores, and interview stage—in one CareerVerse library.</p>
          <Link href="/network" className="cv-strip-link">
            Learn more <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="cv-strip-mock" aria-hidden>
            <div className="cv-strip-mock-row">
              <span>Aisha K.</span>
              <em>94%</em>
            </div>
            <div className="cv-strip-mock-row">
              <span>Rohan M.</span>
              <em>91%</em>
            </div>
            <div className="cv-strip-mock-row">
              <span>Priya N.</span>
              <em>88%</em>
            </div>
          </div>
        </article>

        <article className="cv-strip-card">
          <span className="cv-strip-icon">
            <Workflow size={22} aria-hidden />
          </span>
          <h3>Track your hiring flow</h3>
          <p>Watch Applied → Screening → Interview → Offer update live for every open role.</p>
          <Link href="/hiring-flow" className="cv-strip-link">
            Learn more <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="cv-strip-mock is-stages" aria-hidden>
            <span>Applied 128</span>
            <span>Screen 54</span>
            <span>Interview 34</span>
            <span>Offer 7</span>
          </div>
        </article>
      </div>
    </section>
  );
}
