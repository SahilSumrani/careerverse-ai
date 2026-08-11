import Link from "next/link";
import "./site-footer.css";

/** Dropship footer_bottom on the same blue gradient family as footer_component */
export function SiteFooter() {
  return (
    <footer className="cv-site-footer">
      <div className="cv-site-footer-inner">
        <div className="cv-site-footer-brand">
          <div className="cv-site-footer-logo">
            <span className="cv-site-footer-mark">CV</span>
            <span>CareerVerse AI</span>
          </div>
          <p className="cv-site-footer-tag">Hire with signal, not noise</p>
          <p className="cv-site-footer-desc">
            Explainable AI scoring, voice interviews, resume parsing, and hiring alerts for recruiting teams.
          </p>
        </div>

        <div className="cv-site-footer-cols">
          <div>
            <p className="cv-site-footer-h">Tools</p>
            <ul>
              <li>
                <Link href="/career">Candidate Scoring</Link>
              </li>
              <li>
                <Link href="/resume">Resume Parser</Link>
              </li>
              <li>
                <Link href="/hiring-flow">Hiring flow</Link>
              </li>
              <li>
                <Link href="/copilot">Magic AI Search</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="cv-site-footer-h">Platform</p>
            <ul>
              <li>
                <Link href="/auth/signup">Start Free Trial</Link>
              </li>
              <li>
                <Link href="/auth/signin">Sign in</Link>
              </li>
              <li>
                <Link href="/jobs">Jobs</Link>
              </li>
              <li>
                <Link href="/events">Events</Link>
              </li>
              <li>
                <Link href="/opportunities">Opportunities</Link>
              </li>
              <li>
                <Link href="/network">Talent Library</Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="cv-site-footer-h">Workspace</p>
            <ul>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link href="/applications">Applications</Link>
              </li>
              <li>
                <Link href="/network">Network</Link>
              </li>
              <li>
                <Link href="/mentors">Mentors</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="cv-site-footer-bar">
        <p>© {new Date().getFullYear()} CareerVerse AI. All rights reserved.</p>
        <p>Explainable scores. No opaque ranking black boxes.</p>
      </div>
    </footer>
  );
}
