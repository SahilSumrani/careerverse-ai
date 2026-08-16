import Link from "next/link";
import {
  MapPin,
  IndianRupee,
  Building2,
  CalendarDays,
  Clock3,
  Users,
  Home,
} from "lucide-react";
import {
  isInternshipListing,
  isWorkFromHome,
  type DummyJob,
} from "@/data/jobs";
import { ShareOpeningButton } from "@/components/landing/share-opening-button";
import "./opening-detail.css";

type Props = {
  job: DummyJob;
  kind: "job" | "internship";
};

export function OpeningDetail({ job, kind }: Props) {
  const isIntern = kind === "internship" || isInternshipListing(job);
  const backHref = isIntern ? "/internships" : "/jobs";
  const backLabel = isIntern ? "Internships" : "Jobs";
  const payLabel = isIntern ? "Stipend" : "Salary";
  const wfh = isWorkFromHome(job);
  const duration = job.duration || (isIntern ? "3 Months" : "Permanent");
  const startDate = job.startDate || "Immediately";
  const applyBy = job.applyBy || "30 Sep' 26";
  const openings = job.openings ?? 2;
  const applicants = job.applicants || "100+ applicants";
  const perks = job.perks || ["Certificate", "Flexible hours", "Mentorship"];
  const locationLabel = wfh ? "Work from home" : job.location;

  return (
    <div className="cv-od">
      <div className="cv-od-inner">
        <nav className="cv-od-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={backHref}>{backLabel}</Link>
          <span>/</span>
          <span aria-current="page">{job.title}</span>
        </nav>

        <article className="cv-od-main">
          <header className="cv-od-header">
            <div className="cv-od-header-row">
              <div className="cv-od-header-text">
                {job.activelyHiring !== false ? (
                  <p className="cv-od-active">
                    <span className="cv-od-active-dot" aria-hidden />
                    Actively hiring
                  </p>
                ) : null}
                <h1>
                  {job.title}
                  {isIntern ? " — Internship" : ""}
                  {wfh ? " (WFH)" : ""}
                </h1>
                <p className="cv-od-company">
                  <Building2 size={16} aria-hidden />
                  {job.company}
                </p>
              </div>
              <div className="cv-od-logo" aria-hidden>
                {job.company.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <ul className="cv-od-meta-row">
              <li>
                {wfh ? <Home size={15} aria-hidden /> : <MapPin size={15} aria-hidden />}
                {locationLabel}
                {!wfh && job.workMode !== "On-site" ? ` (${job.workMode})` : ""}
              </li>
              <li>
                <Clock3 size={15} aria-hidden />
                {job.type}
              </li>
              <li>
                <Users size={15} aria-hidden />
                {applicants}
              </li>
            </ul>

            <div className="cv-od-facts">
              <div>
                <span>
                  <CalendarDays size={14} aria-hidden /> Start date
                </span>
                <strong>{startDate}</strong>
              </div>
              <div>
                <span>
                  <Clock3 size={14} aria-hidden /> Duration
                </span>
                <strong>{duration}</strong>
              </div>
              <div>
                <span>
                  <IndianRupee size={14} aria-hidden /> {payLabel}
                </span>
                <strong>{job.salary}</strong>
              </div>
              <div>
                <span>Apply by</span>
                <strong>{applyBy}</strong>
              </div>
            </div>

            <div className="cv-od-header-actions">
              <Link href="/auth/signup" className="cv-od-apply">
                Apply now
              </Link>
              <ShareOpeningButton title={job.title} company={job.company} />
            </div>
          </header>

          <section className="cv-od-section">
            <h2>About the {isIntern ? "internship" : "job"}</h2>
            <p>{job.blurb}</p>
            <p>
              You will collaborate with mentors on CareerVerse AI, ship real product work, and build a portfolio
              recruiters can trust. Expect clear goals, weekly feedback, and explainable match insights tied to your
              profile.
            </p>
            <ul className="cv-od-bullets">
              <li>Work on production-facing features with documented ownership</li>
              <li>Partner with design, recruiting, and engineering teammates</li>
              <li>Practice interviews, resume polish, and hiring-flow tracking in-product</li>
            </ul>
          </section>

          <section className="cv-od-section">
            <h2>Skill(s) required</h2>
            <div className="cv-od-skills">
              {job.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </section>

          <section className="cv-od-section">
            <h2>Who can apply</h2>
            <ol className="cv-od-who">
              <li>
                are available for the {wfh ? "work from home " : ""}
                {isIntern ? "internship" : "job"}
              </li>
              <li>can start {startDate.toLowerCase() === "immediately" ? "immediately" : `around ${startDate}`}</li>
              <li>are available for a duration of {duration.toLowerCase()}</li>
              <li>have relevant skills and interests in {job.tags.slice(0, 2).join(" and ")}</li>
            </ol>
          </section>

          <section className="cv-od-section">
            <h2>Perks</h2>
            <div className="cv-od-perks">
              {perks.map((perk) => (
                <span key={perk}>{perk}</span>
              ))}
            </div>
          </section>

          <section className="cv-od-section">
            <h2>Number of openings</h2>
            <p className="cv-od-openings">{openings}</p>
          </section>

          <section className="cv-od-section">
            <h2>About {job.company}</h2>
            <p className="cv-od-about-co">
              <MapPin size={14} aria-hidden />
              {job.location}
            </p>
            <p>
              {job.company} partners with CareerVerse AI to hire early-career talent with transparent matching—not
              black-box rankings. Teams use explainable scores, structured interviews, and a clear hiring flow from
              applied to offer.
            </p>
            <div className="cv-od-activity">
              <h3>Activity on CareerVerse</h3>
              <ul>
                <li>Actively hiring on CareerVerse</li>
                <li>{openings} openings on this listing</li>
                <li>{applicants} exploring this role</li>
              </ul>
            </div>
          </section>
        </article>
      </div>

      <div className="cv-od-sticky" role="region" aria-label="Apply">
        <div className="cv-od-sticky-inner">
          <div>
            <strong>{job.title}</strong>
            <span>
              {job.company} · {payLabel} {job.salary}
            </span>
          </div>
          <Link href="/auth/signup" className="cv-od-apply">
            Apply now
          </Link>
        </div>
      </div>
    </div>
  );
}
