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
];
