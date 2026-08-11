import Link from "next/link";
import "./home-resume-cta.css";

export function HomeResumeCta() {
  return (
    <section className="cv-resume-cta" aria-labelledby="cv-resume-cta-heading">
      <div className="cv-resume-cta-inner">
        <div className="cv-resume-cta-card">
          <div className="cv-resume-cta-copy">
            <h2 id="cv-resume-cta-heading">No resume? No problem.</h2>
            <p>Let us help you create one or improve the one you&apos;ve got.</p>
            <ul>
              <li>AI-powered resume builder</li>
              <li>Intelligent feedback engine</li>
              <li>Optimized for freshers</li>
            </ul>
            <Link href="/resume" className="cv-resume-cta-btn">
              Build my resume <span aria-hidden>&gt;</span>
            </Link>
          </div>
          <div className="cv-resume-cta-art" aria-hidden>
            <div className="cv-resume-cta-doc">
              <span className="cv-resume-cta-avatar" />
              <span className="cv-resume-cta-line" />
              <span className="cv-resume-cta-line is-short" />
              <span className="cv-resume-cta-line" />
              <span className="cv-resume-cta-line is-mid" />
              <span className="cv-resume-cta-line is-short" />
            </div>
            <div className="cv-resume-cta-chip is-blue">
              <span className="cv-resume-cta-spark" />
              <span />
              <span />
            </div>
            <div className="cv-resume-cta-chip is-peach">
              <span className="cv-resume-cta-spark" />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
