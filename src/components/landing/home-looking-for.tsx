import Link from "next/link";
import { MapPin, IndianRupee } from "lucide-react";
import {
  INTERNSHIP_FILTER_CHIPS,
  JOB_FILTER_CHIPS,
  LOOKING_FOR_CHIPS,
  listingHref,
  isWorkFromHome,
  type DummyJob,
} from "@/data/jobs";
import { loadHomeListingBuckets } from "@/lib/listings-public";
import { LookRail } from "@/components/landing/look-rail";
import { LookFilterChips } from "@/components/landing/look-filter-chips";
import "./home-looking-for.css";

function ListingCard({ job, kind }: { job: DummyJob; kind: "job" | "internship" }) {
  const wfh = isWorkFromHome(job);
  const location = wfh ? "Work From Home" : job.location;

  return (
    <article className="cv-look-card" role="listitem">
      <div className="cv-look-card-body">
        {job.activelyHiring !== false ? (
          <p className="cv-look-hiring">
            <span aria-hidden />
            Actively hiring
          </p>
        ) : null}
        <h4>
          <Link href={listingHref(job)}>{job.title}</Link>
        </h4>
        <p className="cv-look-company">{job.company}</p>
        <ul className="cv-look-meta">
          <li>
            <MapPin size={14} aria-hidden />
            {location}
            {!wfh && job.workMode === "Hybrid" ? " (Hybrid)" : ""}
          </li>
          <li>
            <IndianRupee size={14} aria-hidden />
            {job.salary}
          </li>
        </ul>
      </div>
      <div className="cv-look-card-foot">
        <span className={`cv-look-kind ${kind === "internship" ? "is-intern" : ""}`}>
          {kind === "internship" ? "Internship" : "Job"}
        </span>
        <Link href={listingHref(job)} className="cv-look-details">
          View details &gt;
        </Link>
      </div>
    </article>
  );
}

export async function HomeLookingFor() {
  const { jobs, internships } = await loadHomeListingBuckets();

  return (
    <section className="cv-look" aria-labelledby="cv-look-heading">
      <div className="cv-look-inner">
        <header className="cv-look-head">
          <h2 id="cv-look-heading">What are you looking for today?</h2>
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
            <h3>Fresher Jobs</h3>
            <Link href="/jobs" className="cv-look-view-all">
              View all jobs
            </Link>
          </div>
          <LookFilterChips chips={JOB_FILTER_CHIPS} basePath="/jobs" ariaLabel="Job filters" />
          <LookRail label="Fresher jobs">
            {jobs.length ? (
              jobs.map((job) => <ListingCard key={job.id} job={job} kind="job" />)
            ) : (
              <p className="cv-look-company">No published jobs yet — check back soon.</p>
            )}
          </LookRail>
        </div>

        <div className="cv-look-block" id="internships">
          <div className="cv-look-block-head">
            <h3>Internships</h3>
            <Link href="/internships" className="cv-look-view-all">
              View all internships
            </Link>
          </div>
          <LookFilterChips
            chips={INTERNSHIP_FILTER_CHIPS}
            basePath="/internships"
            ariaLabel="Internship filters"
          />
          <LookRail label="Internships">
            {internships.length ? (
              internships.map((job) => <ListingCard key={job.id} job={job} kind="internship" />)
            ) : (
              <p className="cv-look-company">No published internships yet — check back soon.</p>
            )}
          </LookRail>
        </div>
      </div>
    </section>
  );
}
