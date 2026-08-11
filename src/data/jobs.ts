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
};

/** Marketing / demo job listings for CareerVerse job-seekers (no DB required). */
export const DUMMY_JOBS: DummyJob[] = [
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
  },
  {
    id: "jv-10",
    title: "Marketing Intern",
    company: "BrightPath Campus",
    location: "Work From Home",
    type: "Internship",
    workMode: "Remote",
    salary: "₹10–15k / mo",
    tags: ["Marketing", "Content", "Students"],
    blurb: "Run campus campaigns and social content for early-career hiring seasons.",
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
  },
];

export function getHomeJobs(limit = 8) {
  return DUMMY_JOBS.filter((j) => j.type !== "Internship").slice(0, limit);
}

export function getHomeInternships(limit = 8) {
  return DUMMY_JOBS.filter((j) => j.type === "Internship" || j.type === "Apprenticeship").slice(0, limit);
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
