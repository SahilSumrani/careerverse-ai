export type DummyJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  salary: string;
  tags: string[];
  blurb: string;
  /** Internshala-style extras (optional; sensible defaults applied in UI) */
  duration?: string;
  startDate?: string;
  applyBy?: string;
  openings?: number;
  activelyHiring?: boolean;
  applicants?: string;
  perks?: string[];
};

/**
 * Starter catalog written to Firestore by PLATFORM_ADMIN (`seed_starter_jobs`).
 * Never render this array as live openings — marketing/app read Firestore only.
 */
export const JOB_SEED_CATALOG: DummyJob[] = [
  {
    id: "jv-1",
    title: "Junior Frontend Engineer",
    company: "Northstar Labs",
    location: "Bangalore",
    type: "Full-time",
    workMode: "Hybrid",
    salary: "₹8–12 LPA",
    tags: ["React", "TypeScript", "Early career"],
    blurb: "Build candidate and recruiter surfaces with explainable match scores. Great for grads who ship UI.",
    duration: "Permanent",
    startDate: "Immediately",
    applyBy: "30 Sep' 26",
    openings: 3,
    activelyHiring: true,
    applicants: "240+ applicants",
    perks: ["Flexible hours", "Learning budget", "Hybrid office"],
  },
  {
    id: "jv-2",
    title: "Campus Recruiting Associate",
    company: "BrightPath",
    location: "Hyderabad",
    type: "Full-time",
    workMode: "On-site",
    salary: "₹6–9 LPA",
    tags: ["Campus", "Outreach", "Events"],
    blurb: "Run university hiring seasons, warm silver-medalist talent, and keep hiring managers informed.",
    duration: "Permanent",
    startDate: "Immediately",
    applyBy: "15 Oct' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "180+ applicants",
    perks: ["Travel allowance", "Campus visits", "Performance bonus"],
  },
  {
    id: "jv-3",
    title: "Software Engineering Intern",
    company: "Harbor Collective",
    location: "Remote (India)",
    type: "Internship",
    workMode: "Remote",
    salary: "₹25–40k / mo",
    tags: ["Internship", "Full-stack", "Students"],
    blurb: "Ship features on the CareerVerse stack alongside mentors. Resume parse + scoring exposure included.",
    duration: "3 Months",
    startDate: "Immediately",
    applyBy: "20 Sep' 26",
    openings: 5,
    activelyHiring: true,
    applicants: "1,000+ applicants",
    perks: ["Certificate", "Letter of recommendation", "Flexible hours", "Job offer"],
  },
  {
    id: "jv-4",
    title: "Talent Sourcer",
    company: "Cascade Health",
    location: "Pune",
    type: "Contract",
    workMode: "Hybrid",
    salary: "₹50–70k / mo",
    tags: ["Sourcing", "Healthcare", "AI search"],
    blurb: "Build shortlists with Magic AI Search and hand recruiters clear fit reasons—not black-box ranks.",
    duration: "6 Months",
    startDate: "Immediately",
    applyBy: "12 Sep' 26",
    openings: 1,
    activelyHiring: true,
    applicants: "95+ applicants",
    perks: ["Hybrid", "Healthcare domain", "AI tools"],
  },
  {
    id: "jv-5",
    title: "Data Analyst — Early Career",
    company: "Orbit Finance",
    location: "Mumbai",
    type: "Full-time",
    workMode: "Hybrid",
    salary: "₹7–11 LPA",
    tags: ["SQL", "Analytics", "Fintech"],
    blurb: "Own funnel and score analytics for open roles. Ideal for students strong in SQL and storytelling.",
    duration: "Permanent",
    startDate: "Immediately",
    applyBy: "5 Oct' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "310+ applicants",
    perks: ["Fintech exposure", "Mentorship", "Hybrid"],
  },
  {
    id: "jv-6",
    title: "People Ops Intern",
    company: "CareerVerse Partner Network",
    location: "Delhi NCR",
    type: "Internship",
    workMode: "Hybrid",
    salary: "₹20–30k / mo",
    tags: ["HR", "Scheduling", "Students"],
    blurb: "Support interview scheduling, score reviews, and hiring alerts for a growing talent team.",
    duration: "2 Months",
    startDate: "Immediately",
    applyBy: "28 Sep' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "420+ applicants",
    perks: ["Certificate", "Flexible hours", "Hybrid"],
  },
  {
    id: "jv-7",
    title: "ML Engineer (New Grad)",
    company: "Lumen AI",
    location: "Bangalore",
    type: "Full-time",
    workMode: "On-site",
    salary: "₹12–18 LPA",
    tags: ["ML", "Python", "New grad"],
    blurb: "Train and evaluate ranking models for talent matching. Strong fundamentals over years of experience.",
    duration: "Permanent",
    startDate: "Immediately",
    applyBy: "18 Oct' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "560+ applicants",
    perks: ["Research time", "GPU access", "Mentorship"],
  },
  {
    id: "jv-8",
    title: "UX Designer — Student Pathway",
    company: "SoftQA Studio",
    location: "Remote",
    type: "Apprenticeship",
    workMode: "Remote",
    salary: "₹35–45k / mo",
    tags: ["Design", "Portfolio", "Apprenticeship"],
    blurb: "Design job-seeker flows and onboarding. Mentored apprenticeship with real shipping cadence.",
    duration: "4 Months",
    startDate: "Immediately",
    applyBy: "10 Sep' 26",
    openings: 1,
    activelyHiring: true,
    applicants: "280+ applicants",
    perks: ["Portfolio projects", "Mentorship", "Remote"],
  },
  {
    id: "jv-9",
    title: "Backend Engineer Intern",
    company: "Riverbank Systems",
    location: "Chennai",
    type: "Internship",
    workMode: "Hybrid",
    salary: "₹30–45k / mo",
    tags: ["Node.js", "APIs", "Students"],
    blurb: "Help power applications tracking and notifications APIs used by CareerVerse students nationwide.",
    duration: "3 Months",
    startDate: "Immediately",
    applyBy: "22 Sep' 26",
    openings: 3,
    activelyHiring: true,
    applicants: "640+ applicants",
    perks: ["Certificate", "Job offer", "Hybrid"],
  },
  {
    id: "jv-10",
    title: "Marketing Intern",
    company: "BrightPath Campus",
    location: "Work From Home",
    type: "Internship",
    workMode: "Remote",
    salary: "₹10–15k / mo",
    tags: ["Marketing", "Content", "Students", "Part-time"],
    blurb: "Run campus campaigns and social content for early-career hiring seasons.",
    duration: "2 Months",
    startDate: "Immediately",
    applyBy: "8 Sep' 26",
    openings: 4,
    activelyHiring: true,
    applicants: "890+ applicants",
    perks: ["Certificate", "Flexible hours", "WFH"],
  },
  {
    id: "jv-11",
    title: "UI/UX Design Intern",
    company: "SoftQA Studio",
    location: "Delhi",
    type: "Internship",
    workMode: "Hybrid",
    salary: "₹15–25k / mo",
    tags: ["Design", "Figma", "Students"],
    blurb: "Design job-seeker flows and portfolio case studies with mentored critiques.",
    duration: "3 Months",
    startDate: "Immediately",
    applyBy: "25 Sep' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "510+ applicants",
    perks: ["Certificate", "Portfolio", "Mentorship"],
  },
  {
    id: "jv-12",
    title: "Data Science Intern",
    company: "Orbit Finance",
    location: "Mumbai",
    type: "Internship",
    workMode: "On-site",
    salary: "₹20–35k / mo",
    tags: ["Data Science", "Python", "SQL"],
    blurb: "Support match-score analytics and hiring funnel dashboards for recruiters.",
    duration: "6 Months",
    startDate: "Immediately",
    applyBy: "1 Oct' 26",
    openings: 2,
    activelyHiring: true,
    applicants: "730+ applicants",
    perks: ["Certificate", "Job offer", "Mentorship"],
  },
];

export function isInternshipListing(job: Pick<DummyJob, "type">) {
  return job.type === "Internship" || job.type === "Apprenticeship";
}

export function isWorkFromHome(job: Pick<DummyJob, "location" | "workMode">) {
  const hay = `${job.location} ${job.workMode}`.toLowerCase();
  return /remote|work from home|wfh/.test(hay);
}

export function slugifyPart(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Internshala-like SEO slug ending with listing id (jv-*). */
export function listingSlug(job: DummyJob) {
  const title = slugifyPart(job.title);
  const company = slugifyPart(job.company);
  const location = slugifyPart(job.location.replace(/\(.*?\)/g, ""));
  const wfh = isWorkFromHome(job);

  if (isInternshipListing(job)) {
    if (wfh) return `work-from-home-${title}-internship-at-${company}-${job.id}`;
    return `${title}-internship-in-${location}-at-${company}-${job.id}`;
  }

  if (wfh) return `work-from-home-${title}-job-at-${company}-${job.id}`;
  return `${title}-job-in-${location}-at-${company}-${job.id}`;
}

export function listingHref(job: DummyJob) {
  return isInternshipListing(job)
    ? `/internship/detail/${listingSlug(job)}`
    : `/job/detail/${listingSlug(job)}`;
}

export function getJobByIdFromList(jobs: DummyJob[], id: string) {
  return jobs.find((j) => j.id === id) ?? null;
}

/** Resolve by full slug or trailing id from a listing array (Firestore-backed). */
export function getJobBySlugFromList(jobs: DummyJob[], slug: string) {
  const exact = jobs.find((j) => listingSlug(j) === slug);
  if (exact) return exact;
  const idMatch = slug.match(/([a-z0-9_-]+)\s*$/i);
  if (idMatch) return getJobByIdFromList(jobs, idMatch[1]);
  return null;
}

export function filterHomeJobs(jobs: DummyJob[], limit = 8) {
  return jobs.filter((j) => !isInternshipListing(j)).slice(0, limit);
}

export function filterHomeInternships(jobs: DummyJob[], limit = 8) {
  return jobs.filter((j) => isInternshipListing(j)).slice(0, limit);
}

export const LOOKING_FOR_CHIPS = [
  { label: "Internships", href: "/internships" },
  { label: "Jobs", href: "/jobs" },
  { label: "AI resume", href: "/resume" },
  { label: "Events", href: "/events" },
  { label: "Roadmap", href: "/roadmap" },
] as const;

export const JOB_FILTER_CHIPS = [
  "Work from home",
  "Part-time",
  "Engineering",
  "Design",
  "Data Science",
  "Big brands",
  "MBA",
  "Media",
] as const;

export const INTERNSHIP_FILTER_CHIPS = [
  "Work from home",
  "Part-time",
  "Engineering",
  "Design",
  "Data Science",
  "Big brands",
  "Marketing",
  "MBA",
] as const;
