import Link from "next/link";
import "./home-empower-cta.css";

export function HomeEmpowerCta() {
  return (
    <section className="cv-empower" aria-labelledby="cv-empower-heading">
      <div className="cv-empower-inner">
        <p className="cv-empower-eyebrow">CareerVerse AI</p>
        <h2 id="cv-empower-heading">Empower your career with CareerVerse today</h2>
        <p className="cv-empower-lead">
          Upload your resume, unlock explainable match scores, practice with AI, and apply to internships
          and fresher jobs that fit your path.
        </p>
        <div className="cv-empower-actions">
          <Link href="/auth/signup" className="cv-empower-primary">
            Get started free
          </Link>
          <Link href="/internships" className="cv-empower-secondary">
            Browse internships
          </Link>
          <Link href="/jobs" className="cv-empower-secondary">
            Browse jobs
          </Link>
        </div>
        <ul className="cv-empower-stats">
          <li>
            <strong>AI resume parse</strong>
            <span>Structured skills in seconds</span>
          </li>
          <li>
            <strong>Match scores</strong>
            <span>Explainable fit, not black-box ranks</span>
          </li>
          <li>
            <strong>Internships + jobs</strong>
            <span>Student-first openings to explore</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
