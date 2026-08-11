export type CandidateCard = {
  id: string;
  name: string;
  role: string;
  score: number;
  status: string;
  trend: string;
  initials: string;
  tint: string;
};

/** @deprecated Prefer COMPANY_MARQUEE for hero tunnel */
export const CANDIDATE_MARQUEE: CandidateCard[] = [
  { id: "1", name: "Aisha Khan", role: "Senior React Engineer", score: 94, status: "Interview", trend: "+12%", initials: "AK", tint: "#225aea" },
  { id: "2", name: "Rohan Mehta", role: "Staff Backend", score: 91, status: "Screening", trend: "+8%", initials: "RM", tint: "#0ea5e9" },
  { id: "3", name: "Priya Nair", role: "Product Designer", score: 88, status: "Offer", trend: "+15%", initials: "PN", tint: "#8b5cf6" },
  { id: "4", name: "James Okonkwo", role: "ML Engineer", score: 96, status: "Interview", trend: "+21%", initials: "JO", tint: "#10b981" },
  { id: "5", name: "Sofia Alvarez", role: "Full-Stack Dev", score: 87, status: "Applied", trend: "+6%", initials: "SA", tint: "#f59e0b" },
  { id: "6", name: "Arjun Patel", role: "DevOps Lead", score: 90, status: "Interview", trend: "+9%", initials: "AP", tint: "#ef4444" },
  { id: "7", name: "Mina Choi", role: "Data Scientist", score: 93, status: "Screening", trend: "+11%", initials: "MC", tint: "#06b6d4" },
  { id: "8", name: "Liam Brooks", role: "iOS Engineer", score: 85, status: "Applied", trend: "+4%", initials: "LB", tint: "#6366f1" },
  { id: "9", name: "Fatima Zahra", role: "QA Automation", score: 89, status: "Interview", trend: "+7%", initials: "FZ", tint: "#ec4899" },
  { id: "10", name: "Ethan Cole", role: "Security Engineer", score: 92, status: "Offer", trend: "+18%", initials: "EC", tint: "#14b8a6" },
  { id: "11", name: "Neha Gupta", role: "Product Manager", score: 86, status: "Screening", trend: "+5%", initials: "NG", tint: "#3b82f6" },
  { id: "12", name: "Diego Santos", role: "Platform Engineer", score: 95, status: "Interview", trend: "+14%", initials: "DS", tint: "#a855f7" },
];

export type CompanyMarqueeCard = {
  id: string;
  company: string;
  role: string;
  kind: "Internship" | "Job" | "Apprenticeship" | "Contract";
  badge: string;
  initials: string;
  tint: string;
  logoUrl?: string;
};

const COMPANY_TINTS = [
  "#225aea",
  "#0ea5e9",
  "#0284c7",
  "#2563eb",
  "#1d4ed8",
  "#0369a1",
  "#3b82f6",
  "#0f766e",
  "#0891b2",
  "#1e40af",
  "#164e63",
  "#1e3a8a",
];

/** Hiring-company cards for the Dropship-style hero tunnel (from DUMMY_JOBS). */
export const COMPANY_MARQUEE: CompanyMarqueeCard[] = [
  { id: "jv-1", company: "Northstar Labs", role: "Junior Frontend Engineer", kind: "Job", badge: "Hiring", initials: "NL", tint: COMPANY_TINTS[0] },
  { id: "jv-2", company: "BrightPath", role: "Campus Recruiting Associate", kind: "Job", badge: "Hiring", initials: "BP", tint: COMPANY_TINTS[1] },
  { id: "jv-3", company: "Harbor Collective", role: "Software Engineering Intern", kind: "Internship", badge: "Open", initials: "HC", tint: COMPANY_TINTS[2] },
  { id: "jv-4", company: "Cascade Health", role: "Talent Sourcer", kind: "Contract", badge: "Hiring", initials: "CH", tint: COMPANY_TINTS[3] },
  { id: "jv-5", company: "Orbit Finance", role: "Data Analyst — Early Career", kind: "Job", badge: "Hiring", initials: "OF", tint: COMPANY_TINTS[4] },
  { id: "jv-6", company: "CareerVerse Partners", role: "People Ops Intern", kind: "Internship", badge: "Open", initials: "CP", tint: COMPANY_TINTS[5] },
  { id: "jv-7", company: "Lumen AI", role: "ML Engineer (New Grad)", kind: "Job", badge: "Hiring", initials: "LA", tint: COMPANY_TINTS[6] },
  { id: "jv-8", company: "SoftQA Studio", role: "UX Designer Pathway", kind: "Apprenticeship", badge: "Open", initials: "SQ", tint: COMPANY_TINTS[7] },
  { id: "jv-9", company: "Riverbank Systems", role: "Backend Engineer Intern", kind: "Internship", badge: "Open", initials: "RS", tint: COMPANY_TINTS[8] },
  { id: "jv-10", company: "BrightPath Campus", role: "Marketing Intern", kind: "Internship", badge: "Open", initials: "BC", tint: COMPANY_TINTS[9] },
  { id: "jv-11", company: "SoftQA Studio", role: "UI/UX Design Intern", kind: "Internship", badge: "Hiring", initials: "SQ", tint: COMPANY_TINTS[10] },
  { id: "jv-12", company: "Orbit Finance", role: "Data Science Intern", kind: "Internship", badge: "Open", initials: "OF", tint: COMPANY_TINTS[11] },
];

export const HOME_TOOLS = [
  {
    id: "voice",
    title: "Voice Interviews",
    description: "Run structured AI voice interviews that score communication, depth, and role fit—then review transcripts with your team.",
    href: "/auth/signup",
    points: [
      { title: "Structured rubrics", text: "Score answers against role-specific criteria." },
      { title: "Transcripts", text: "Searchable recordings with highlight notes." },
      { title: "Bias checks", text: "Consistent prompts for every candidate." },
    ],
    tint: "from-[#225aea] to-[#60a5fa]",
  },
  {
    id: "resume",
    title: "Resume Parser",
    description: "Parse PDF/DOCX resumes into structured skills, experience, and role alignment signals in seconds.",
    href: "/resume",
    points: [
      { title: "Structured extract", text: "Skills, tenure, and education mapped cleanly." },
      { title: "Role alignment", text: "Compare against the job you are hiring for." },
      { title: "Gaps flagged", text: "Missing keywords and experience called out." },
    ],
    tint: "from-[#ef4444] to-[#fb7185]",
  },
  {
    id: "roles",
    title: "Role Bank",
    description: "Store and reuse role profiles with required skills, interview kits, and scoring weights.",
    href: "/careers",
    points: [
      { title: "Reusable kits", text: "Interview kits tied to each role." },
      { title: "Skill weights", text: "Tune what matters most for the hire." },
      { title: "Team templates", text: "Share role banks across recruiters." },
    ],
    tint: "from-[#8b5cf6] to-[#c084fc]",
  },
  {
    id: "analytics",
    title: "Analytics Reports",
    description: "See funnel conversion, time-to-interview, and score distributions across roles and sources.",
    href: "/dashboard",
    points: [
      { title: "Funnel views", text: "Applied → Interview → Offer in one chart." },
      { title: "Score trends", text: "Watch AI scores move by cohort." },
      { title: "Export", text: "Share reports with hiring managers." },
    ],
    tint: "from-[#10b981] to-[#34d399]",
  },
  {
    id: "scoring",
    title: "Candidate Scoring",
    description: "Explainable AI match scores with strengths, gaps, and recommended next steps—never opaque rankings.",
    href: "/career",
    points: [
      { title: "Explainable", text: "See why a candidate scored high or low." },
      { title: "Comparable", text: "Rank shortlists fairly across a role." },
      { title: "Actionable", text: "Next steps for recruiter and candidate." },
    ],
    tint: "from-[#f59e0b] to-[#fbbf24]",
  },
  {
    id: "scheduler",
    title: "Interview Scheduler",
    description: "Coordinate panels, send invites, and keep stages moving without spreadsheet chaos.",
    href: "/applications",
    points: [
      { title: "Panel sync", text: "Book interviewers without email ping-pong." },
      { title: "Stage moves", text: "Advance candidates as soon as slots fill." },
      { title: "Reminders", text: "Keep both sides on time." },
    ],
    tint: "from-[#06b6d4] to-[#22d3ee]",
  },
  {
    id: "hubspot",
    title: "HubSpot Sync",
    description: "Push qualified candidates and stage changes into HubSpot so GTM and recruiting stay aligned.",
    href: "/auth/signup",
    points: [
      { title: "Two-way sync", text: "Stages update where your team already works." },
      { title: "Owner maps", text: "Assign recruiters and hiring managers." },
      { title: "Audit trail", text: "Know what synced and when." },
    ],
    tint: "from-[#f97316] to-[#fb923c]",
  },
  {
    id: "discord",
    title: "Discord Alerts",
    description: "Get channel alerts when high-score candidates apply, finish interviews, or need a decision.",
    href: "/auth/signup",
    points: [
      { title: "Score alerts", text: "Ping when someone clears your threshold." },
      { title: "Stage bots", text: "Notify channels when candidates advance." },
      { title: "Team speed", text: "Decide where the team already chats." },
    ],
    tint: "from-[#5865F2] to-[#7289da]",
  },
  {
    id: "magic",
    title: "Magic AI Search",
    description: "Ask for talent in plain language—filters and shortlists assemble from your candidate bank automatically.",
    href: "/copilot",
    points: [
      { title: "Natural language", text: "Describe the hire the way you think." },
      { title: "Live filters", text: "Skills, location, and score applied instantly." },
      { title: "Shortlists", text: "Save and share curated sets." },
    ],
    tint: "from-[#225aea] to-[#818cf8]",
  },
  {
    id: "talent",
    title: "Talent Library",
    description: "A living library of past candidates, warm leads, and silver medalists ready for the next open role.",
    href: "/network",
    points: [
      { title: "Warm pool", text: "Re-engage strong past finalists." },
      { title: "Tags", text: "Organize by skill, role, and source." },
      { title: "Reach out", text: "Kick off outreach without leaving the OS." },
    ],
    tint: "from-[#64748b] to-[#94a3b8]",
  },
] as const;

/** Magic AI Search looping prompts — keep odd count so floor(n/2) is center */
export const AI_PROMPTS = [
  "Find senior React engineers in Bangalore with 5+ years",
  "Show candidates who scored 90+ on system design",
  "Shortlist PMs with B2B SaaS experience ready to interview",
  "Who finished voice interviews this week above 85?",
  "Surface ML engineers open to hybrid roles in Hyderabad",
  "Find designers with strong portfolio match scores",
  "Who is hiring-ready in my shortlist right now?",
];

export const PERKS = [
  {
    title: "Hands-free screening",
    text: "AI scores resumes and voice interviews so your team only reviews the shortlist that matters.",
    icon: "calendar" as const,
  },
  {
    title: "Save recruiter hours",
    text: "Parse, score, schedule, and alert in one place—fewer tabs and faster hiring decisions.",
    icon: "clock" as const,
  },
  {
    title: "Faster time-to-hire",
    text: "Move strong candidates from apply to offer with explainable scores and shared rubrics.",
    icon: "receipt" as const,
  },
  {
    title: "Clear hiring insights",
    text: "Funnel analytics, score distributions, and source quality for every open role.",
    icon: "chart" as const,
  },
  {
    title: "Real-time alerts",
    text: "Slack and Discord pings when high-score candidates apply or finish interviews.",
    icon: "alert" as const,
  },
  {
    title: "Works anywhere",
    text: "Review shortlists, scores, and interview notes from any device.",
    icon: "phone" as const,
  },
];

export const BLOG_POSTS = [
  {
    date: "Aug 4, 2026",
    readTime: "6 min",
    title: "How AI voice interviews reduce first-round bias",
    excerpt: "Structured prompts and shared rubrics keep every candidate on the same playing field.",
    href: "/events",
  },
  {
    date: "Jul 28, 2026",
    readTime: "4 min",
    title: "Building an explainable candidate score",
    excerpt: "Why opaque rankings fail hiring managers—and how to show strengths and gaps clearly.",
    href: "/events",
  },
  {
    date: "Jul 12, 2026",
    readTime: "5 min",
    title: "From LinkedIn lead to scheduled interview in one day",
    excerpt: "A practical hiring flow using parser, scoring, Discord alerts, and scheduler together.",
    href: "/events",
  },
];
