import Link from "next/link";
import { MapPin, IndianRupee, Briefcase, GraduationCap } from "lucide-react";
import {
  getHomeInternships,
  getHomeJobs,
  INTERNSHIP_FILTER_CHIPS,
  JOB_FILTER_CHIPS,
  LOOKING_FOR_CHIPS,
  listingHref,
  type DummyJob,
} from "@/data/jobs";
import { LookRail } from "@/components/landing/look-rail";
import "./home-looking-for.css";

function ListingCard({ job, kind }: { job: DummyJob; kind: "job" | "internship" }) {
  return (
    <Link href={listingHref(job)} className="cv-look-card" role="listitem">
      <div className="cv-look-card-top">
        <span className={`cv-look-badge ${kind === "internship" ? "is-intern" : ""}`}>
          {kind === "internship" ? "Internship" : job.type}
        </span>
        <span className="cv-look-mode">{job.workMode}</span>
      </div>
      <h4>{job.title}</h4>
      <p className="cv-look-company">{job.company}</p>
      <ul className="cv-look-meta">
        <li>
          <MapPin size={14} aria-hidden />
          {job.location}
        </li>
        <li>
          <IndianRupee size={14} aria-hidden />
          {job.salary}
        </li>
      </ul>
      <div className="cv-look-tags">
        {job.tags.slice(0, 3).map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <span className="cv-look-details">View details →</span>
    </Link>
  );
}

export function HomeLookingFor() {
  const jobs = getHomeJobs(8);
  const internships = getHomeInternships(8);

  return (
    <section className="cv-look" aria-labelledby="cv-look-heading">
      <div className="cv-look-inner">
        <header className="cv-look-head">
          <h2 id="cv-look-heading">What are you looking for today?</h2>
          <p>Internships, fresher jobs, and AI tools to get you hired—pick a path and start exploring.</p>
          <div className="cv-look-intent" role="list">
            {LOOKING_FOR_CHIPS.map((chip) => (
              <Link key={chip.href} href={chip.href} className="cv-look-intent-chip" role="listitem">
                {chip.label}
              </Link>
            ))}
          </div>
        </header>

        <div className="cv-look-block">
          <div className="cv-look-block-head">
            <div>
              <h3>
                <Briefcase size={20} aria-hidden />
                Fresher Jobs
              </h3>
              <p>Early-career roles with clear salary bands and work modes.</p>
            </div>
            <Link href="/jobs" className="cv-look-view-all">
              View all jobs →
            </Link>
          </div>
          <div className="cv-look-filters" aria-label="Job filters">
            {JOB_FILTER_CHIPS.map((chip) => (
              <Link key={chip} href={`/jobs?q=${encodeURIComponent(chip)}`} className="cv-look-filter">
                {chip}
              </Link>
            ))}
          </div>
          <LookRail label="Fresher jobs">
            {jobs.map((job) => (
              <ListingCard key={job.id} job={job} kind="job" />
            ))}
          </LookRail>
        </div>

        <div className="cv-look-block" id="internships">
          <div className="cv-look-block-head">
            <div>
              <h3>
                <GraduationCap size={20} aria-hidden />
                Internships
              </h3>
              <p>Paid and mentored internships for students—remote, hybrid, and on-site.</p>
            </div>
            <Link href="/internships" className="cv-look-view-all">
              View all internships →
            </Link>
          </div>
          <div className="cv-look-filters" aria-label="Internship filters">
            {INTERNSHIP_FILTER_CHIPS.map((chip) => (
              <Link
                key={chip}
                href={`/internships?q=${encodeURIComponent(chip)}`}
                className="cv-look-filter"
              >
                {chip}
              </Link>
            ))}
          </div>
          <LookRail label="Internships">
            {internships.map((job) => (
              <ListingCard key={job.id} job={job} kind="internship" />
            ))}
          </LookRail>
        </div>
      </div>
    </section>
  );
}
