import Link from "next/link";
import { MapPin, IndianRupee, Building2, Clock3 } from "lucide-react";
import { listingHref, type DummyJob } from "@/data/jobs";
import "./listings-board.css";

type Props = {
  kind: "jobs" | "internships";
  title: string;
  subtitle: string;
  items: DummyJob[];
  filters: readonly string[];
  searchPlaceholder?: string;
};

export function ListingsBoard({
  kind,
  title,
  subtitle,
  items,
  filters,
  searchPlaceholder = "e.g. Design, Mumbai, React",
}: Props) {
  const countLabel = kind === "internships" ? "internships" : "jobs";

  return (
    <div className="cv-board">
      <header className="cv-board-hero">
        <div className="cv-board-hero-inner">
          <p className="cv-board-kicker">CareerVerse AI</p>
          <h1>{title}</h1>
          <p className="cv-board-sub">{subtitle}</p>
          <form className="cv-board-search" action={kind === "internships" ? "/internships" : "/jobs"} method="get">
            <input name="q" type="search" placeholder={searchPlaceholder} aria-label="Search listings" />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>

      <div className="cv-board-body">
        <aside className="cv-board-filters" aria-label="Filters">
          <h2>Filters</h2>
          <label className="cv-board-check">
            <input type="checkbox" readOnly checked={false} />
            Work from home
          </label>
          <label className="cv-board-check">
            <input type="checkbox" readOnly checked={false} />
            Part-time
          </label>
          <div className="cv-board-filter-group">
            <p>Popular categories</p>
            <div className="cv-board-chips">
              {filters.map((chip) => (
                <Link
                  key={chip}
                  href={`/${kind}?q=${encodeURIComponent(chip)}`}
                  className="cv-board-chip"
                >
                  {chip}
                </Link>
              ))}
            </div>
          </div>
          <div className="cv-board-filter-group">
            <p>Quick links</p>
            <ul className="cv-board-links">
              <li>
                <Link href="/internships">Internships</Link>
              </li>
              <li>
                <Link href="/jobs">Fresher jobs</Link>
              </li>
              <li>
                <Link href="/auth/signup">Get started</Link>
              </li>
            </ul>
          </div>
        </aside>

        <section className="cv-board-list" aria-label={`${countLabel} list`}>
          <div className="cv-board-list-head">
            <h2>
              {items.length} {countLabel} available
            </h2>
            <p>Sample listings — sign in for explainable match scores.</p>
          </div>

          <div className="cv-board-cards">
            {items.map((job) => (
              <article key={job.id} className="cv-board-card">
                <div className="cv-board-card-main">
                  <div className="cv-board-card-top">
                    <span className={`cv-board-type ${kind === "internships" ? "is-intern" : ""}`}>
                      {job.type}
                    </span>
                    <span className="cv-board-mode">{job.workMode}</span>
                  </div>
                  <h3>{job.title}</h3>
                  <p className="cv-board-company">
                    <Building2 size={14} aria-hidden />
                    {job.company}
                  </p>
                  <ul className="cv-board-meta">
                    <li>
                      <MapPin size={14} aria-hidden />
                      {job.location}
                    </li>
                    <li>
                      <IndianRupee size={14} aria-hidden />
                      {job.salary}
                    </li>
                    <li>
                      <Clock3 size={14} aria-hidden />
                      {job.workMode}
                    </li>
                  </ul>
                  <p className="cv-board-blurb">{job.blurb}</p>
                  <div className="cv-board-tags">
                    {job.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="cv-board-card-actions">
                  <Link href="/auth/signup" className="cv-board-apply">
                    Apply now
                  </Link>
                  <Link href={listingHref(job)} className="cv-board-view">
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
