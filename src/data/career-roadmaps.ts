/** Comprehensive career roles for interactive roadmaps. */

export type RoadmapMilestone = {
  id: string;
  title: string;
  detail: string;
};

export type RoadmapStage = {
  id: string;
  title: string;
  weeks?: string;
  skills: string[];
  milestones: RoadmapMilestone[];
};

export type CareerRoadmapRole = {
  id: string;
  title: string;
  category: string;
  blurb: string;
  isDemo?: boolean;
  stages: RoadmapStage[];
};

export const CAREER_ROADMAP_ROLES: CareerRoadmapRole[] = [
  {
    id: "frontend",
    title: "Frontend Engineer",
    category: "Engineering",
    blurb: "Build polished product UIs with React, accessibility, and performance.",
    isDemo: true,
    stages: [
      {
        id: "foundations",
        title: "Foundations",
        weeks: "2–4 weeks",
        skills: ["HTML/CSS", "JavaScript", "Git", "Responsive layout"],
        milestones: [
          { id: "f1", title: "Ship a responsive landing page", detail: "Semantic HTML, CSS layout, deploy to Vercel." },
          { id: "f2", title: "JS fundamentals kata", detail: "Arrays, async/await, DOM events without a framework." },
        ],
      },
      {
        id: "react",
        title: "React & tooling",
        weeks: "4–6 weeks",
        skills: ["React", "TypeScript", "Vite/Next", "Component design"],
        milestones: [
          { id: "r1", title: "Build a multi-page React app", detail: "Routing, forms, local state, and loading/empty states." },
          { id: "r2", title: "Add TypeScript strictly", detail: "Props, API types, and zero `any` in your project." },
        ],
      },
      {
        id: "product",
        title: "Product polish",
        weeks: "3–5 weeks",
        skills: ["A11y", "Performance", "Design systems", "Testing"],
        milestones: [
          { id: "p1", title: "Accessibility pass", detail: "Keyboard nav, labels, contrast, and screen-reader smoke test." },
          { id: "p2", title: "Portfolio case study", detail: "Write problem → approach → outcome for one shipped UI." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2–3 weeks",
        skills: ["System design lite", "Behavioral", "Live coding"],
        milestones: [
          { id: "i1", title: "Frontend interview set", detail: "3 timed UI builds + 5 behavioral stories." },
          { id: "i2", title: "Apply to 8 roles", detail: "Tailor resume bullets to React/TS impact metrics." },
        ],
      },
    ],
  },
  {
    id: "backend",
    title: "Backend Engineer",
    category: "Engineering",
    blurb: "APIs, data models, auth, and reliable services.",
    isDemo: true,
    stages: [
      {
        id: "foundations",
        title: "Foundations",
        weeks: "2–4 weeks",
        skills: ["HTTP", "SQL", "Node/Python", "Git"],
        milestones: [
          { id: "b1", title: "CRUD API", detail: "REST endpoints with validation and error shapes." },
          { id: "b2", title: "Schema design", detail: "Normalize tables and write 5 useful queries." },
        ],
      },
      {
        id: "systems",
        title: "Services & auth",
        weeks: "4–6 weeks",
        skills: ["Auth", "Caching", "Queues", "Observability"],
        milestones: [
          { id: "b3", title: "Auth + roles", detail: "JWT/session auth with protected routes." },
          { id: "b4", title: "Background jobs", detail: "One async worker path with retries." },
        ],
      },
      {
        id: "scale",
        title: "Reliability",
        weeks: "3–4 weeks",
        skills: ["Tests", "Migrations", "Rate limits", "Docs"],
        milestones: [
          { id: "b5", title: "Integration tests", detail: "Happy path + failure path for core API." },
          { id: "b6", title: "Runbook", detail: "Document deploy, rollback, and common incidents." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2–3 weeks",
        skills: ["DSA basics", "System design", "Behavioral"],
        milestones: [
          { id: "b7", title: "Design a URL shortener", detail: "Trade-offs: storage, hashing, analytics." },
          { id: "b8", title: "Apply to 8 roles", detail: "Highlight API ownership and incidents fixed." },
        ],
      },
    ],
  },
  {
    id: "fullstack",
    title: "Full-Stack Engineer",
    category: "Engineering",
    blurb: "Own features end-to-end across UI, API, and data.",
    isDemo: true,
    stages: [
      {
        id: "slice",
        title: "Vertical slice",
        weeks: "3–5 weeks",
        skills: ["React", "API design", "SQL", "Auth"],
        milestones: [
          { id: "fs1", title: "Feature from UI → DB", detail: "One user story with migrations and UI states." },
          { id: "fs2", title: "Auth gate", detail: "Login + protected page + role check." },
        ],
      },
      {
        id: "product",
        title: "Product features",
        weeks: "4–6 weeks",
        skills: ["Next.js", "Prisma/Firestore", "Uploads", "Email"],
        milestones: [
          { id: "fs3", title: "File upload flow", detail: "Validate, store, and display with errors." },
          { id: "fs4", title: "Admin + user views", detail: "Same data, two permissioned UIs." },
        ],
      },
      {
        id: "ship",
        title: "Ship & measure",
        weeks: "2–4 weeks",
        skills: ["CI", "Monitoring", "A11y", "Perf"],
        milestones: [
          { id: "fs5", title: "CI green", detail: "Lint + typecheck + tests on every PR." },
          { id: "fs6", title: "Case study", detail: "Document trade-offs and metrics." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2–3 weeks",
        skills: ["Full-stack design", "Debugging", "Behavioral"],
        milestones: [
          { id: "fs7", title: "Whiteboard a feature", detail: "API contract + UI states + failure modes." },
          { id: "fs8", title: "Apply to 8 roles", detail: "Lead with end-to-end ownership." },
        ],
      },
    ],
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    category: "Data",
    blurb: "SQL, dashboards, and decision-ready storytelling.",
    isDemo: true,
    stages: [
      {
        id: "sql",
        title: "SQL fluency",
        weeks: "3–4 weeks",
        skills: ["SQL", "Joins", "Window functions", "Data cleaning"],
        milestones: [
          { id: "d1", title: "10 business queries", detail: "Funnels, retention, and cohort basics." },
          { id: "d2", title: "Clean a messy dataset", detail: "Nulls, duplicates, typed columns." },
        ],
      },
      {
        id: "viz",
        title: "Visualization",
        weeks: "3–4 weeks",
        skills: ["Tableau/Looker", "Python/pandas", "Storytelling"],
        milestones: [
          { id: "d3", title: "Dashboard v1", detail: "3 charts + KPI strip with filters." },
          { id: "d4", title: "Insight memo", detail: "One-page recommendation with evidence." },
        ],
      },
      {
        id: "impact",
        title: "Business impact",
        weeks: "2–3 weeks",
        skills: ["Experiment basics", "Stakeholder asks", "Metrics"],
        milestones: [
          { id: "d5", title: "Define North Star metrics", detail: "Input vs output metrics for a product." },
          { id: "d6", title: "Portfolio pack", detail: "2 case studies with before/after." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2 weeks",
        skills: ["SQL live", "Case interviews", "Behavioral"],
        milestones: [
          { id: "d7", title: "Timed SQL set", detail: "5 questions under 45 minutes." },
          { id: "d8", title: "Apply to 8 roles", detail: "Quantify decisions influenced." },
        ],
      },
    ],
  },
  {
    id: "ml",
    title: "ML Engineer / Data Scientist",
    category: "Data",
    blurb: "Modeling, evaluation, and shipping ML features responsibly.",
    isDemo: true,
    stages: [
      {
        id: "math",
        title: "Core toolkit",
        weeks: "4–6 weeks",
        skills: ["Python", "pandas", "scikit-learn", "Eval metrics"],
        milestones: [
          { id: "m1", title: "Baseline model", detail: "Train/test split, metrics, and error analysis." },
          { id: "m2", title: "Feature notebook", detail: "Document leakage checks and feature importance." },
        ],
      },
      {
        id: "mlops",
        title: "From notebook to service",
        weeks: "4–5 weeks",
        skills: ["APIs", "Model packaging", "Monitoring", "Data pipelines"],
        milestones: [
          { id: "m3", title: "Model API", detail: "Serve predictions with input validation." },
          { id: "m4", title: "Drift checklist", detail: "Define alerts for data/quality drift." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2–3 weeks",
        skills: ["ML system design", "Stats", "Behavioral"],
        milestones: [
          { id: "m5", title: "Design a recommender", detail: "Cold start, evaluation, and feedback loops." },
          { id: "m6", title: "Apply to 8 roles", detail: "Lead with shipped experiments." },
        ],
      },
    ],
  },
  {
    id: "design",
    title: "Product Designer (UI/UX)",
    category: "Design",
    blurb: "Research, flows, and high-craft interfaces.",
    isDemo: true,
    stages: [
      {
        id: "craft",
        title: "Visual craft",
        weeks: "3–4 weeks",
        skills: ["Figma", "Typography", "Layout", "Components"],
        milestones: [
          { id: "ux1", title: "Redesign a broken flow", detail: "Before/after with rationale." },
          { id: "ux2", title: "Component library starter", detail: "Buttons, inputs, and spacing tokens." },
        ],
      },
      {
        id: "research",
        title: "Research & UX",
        weeks: "3–4 weeks",
        skills: ["User interviews", "Flows", "Usability tests", "IA"],
        milestones: [
          { id: "ux3", title: "5 interviews", detail: "Synthesize pains into opportunity areas." },
          { id: "ux4", title: "Prototype test", detail: "5 users, 3 tasks, prioritized fixes." },
        ],
      },
      {
        id: "portfolio",
        title: "Portfolio & hire",
        weeks: "2–3 weeks",
        skills: ["Case writing", "Critique", "Handoff"],
        milestones: [
          { id: "ux5", title: "2 case studies", detail: "Problem, process, outcome, learnings." },
          { id: "ux6", title: "Apply to 8 roles", detail: "Tailor portfolio order per role." },
        ],
      },
    ],
  },
  {
    id: "pm",
    title: "Product Manager",
    category: "Product",
    blurb: "Discovery, prioritization, and shipping with clarity.",
    isDemo: true,
    stages: [
      {
        id: "discovery",
        title: "Discovery",
        weeks: "3–4 weeks",
        skills: ["Problem framing", "User research", "Metrics", "PRDs"],
        milestones: [
          { id: "pm1", title: "Opportunity brief", detail: "Who/what/why + success metrics." },
          { id: "pm2", title: "PRD v1", detail: "Scope, non-goals, and risks." },
        ],
      },
      {
        id: "delivery",
        title: "Delivery",
        weeks: "4–5 weeks",
        skills: ["Roadmapping", "Stakeholder mgmt", "Experiments", "Specs"],
        milestones: [
          { id: "pm3", title: "Prioritized backlog", detail: "RICE or similar with trade-offs written." },
          { id: "pm4", title: "Ship a small bet", detail: "Define experiment and readout." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2–3 weeks",
        skills: ["Product sense", "Estimation", "Behavioral"],
        milestones: [
          { id: "pm5", title: "3 product critiques", detail: "Improve a consumer and B2B product." },
          { id: "pm6", title: "Apply to 8 roles", detail: "Stories of influence without authority." },
        ],
      },
    ],
  },
  {
    id: "campus",
    title: "Campus Recruiting Associate",
    category: "People / Recruiting",
    blurb: "Campus pipelines, events, and candidate experience.",
    isDemo: true,
    stages: [
      {
        id: "campus-basics",
        title: "Campus basics",
        weeks: "2–3 weeks",
        skills: ["Employer branding", "Event ops", "CRM hygiene", "Outreach"],
        milestones: [
          { id: "c1", title: "Campus calendar", detail: "Map target schools and event types." },
          { id: "c2", title: "Outreach pack", detail: "Email + LinkedIn templates with CTA." },
        ],
      },
      {
        id: "pipeline",
        title: "Pipeline ownership",
        weeks: "3–4 weeks",
        skills: ["Sourcing", "Screening", "Scheduling", "Reporting"],
        milestones: [
          { id: "c3", title: "Funnel dashboard", detail: "Apply → screen → interview conversion." },
          { id: "c4", title: "Run a campus event", detail: "Agenda, follow-ups, and debrief notes." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2 weeks",
        skills: ["Behavioral", "Stakeholder stories", "Metrics"],
        milestones: [
          { id: "c5", title: "Case: fill an intern class", detail: "Plan volume, channels, and SLAs." },
          { id: "c6", title: "Apply to 8 roles", detail: "Quantify events run and hires influenced." },
        ],
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps / Platform Engineer",
    category: "Engineering",
    blurb: "CI/CD, cloud, and developer experience.",
    isDemo: true,
    stages: [
      {
        id: "cloud",
        title: "Cloud & CI",
        weeks: "3–5 weeks",
        skills: ["Linux", "Docker", "CI/CD", "IaC basics"],
        milestones: [
          { id: "dv1", title: "Containerize an app", detail: "Dockerfile + compose for local stack." },
          { id: "dv2", title: "Pipeline", detail: "Build, test, deploy on push." },
        ],
      },
      {
        id: "platform",
        title: "Platform practices",
        weeks: "4–5 weeks",
        skills: ["Observability", "Secrets", "Scaling", "Cost"],
        milestones: [
          { id: "dv3", title: "Dashboards + alerts", detail: "Latency, errors, saturation." },
          { id: "dv4", title: "Hardening checklist", detail: "Secrets, least privilege, backups." },
        ],
      },
      {
        id: "interview",
        title: "Interview ready",
        weeks: "2 weeks",
        skills: ["Incident response", "Design", "Behavioral"],
        milestones: [
          { id: "dv5", title: "Postmortem exercise", detail: "Timeline, root cause, action items." },
          { id: "dv6", title: "Apply to 8 roles", detail: "Show reliability outcomes." },
        ],
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobile Engineer",
    category: "Engineering",
    blurb: "Native or cross-platform apps with strong UX.",
    isDemo: true,
    stages: [
      {
        id: "app-basics",
        title: "App foundations",
        weeks: "3–5 weeks",
        skills: ["Swift/Kotlin/RN", "Navigation", "State", "Networking"],
        milestones: [
          { id: "mb1", title: "List + detail app", detail: "API fetch, caching, empty/error states." },
          { id: "mb2", title: "Offline-friendly UX", detail: "Graceful degradation when network fails." },
        ],
      },
      {
        id: "ship-store",
        title: "Ship quality",
        weeks: "3–4 weeks",
        skills: ["Testing", "Perf", "Store listing", "Analytics"],
        milestones: [
          { id: "mb3", title: "Release checklist", detail: "Crash-free, permissions, privacy labels." },
          { id: "mb4", title: "Apply to 8 roles", detail: "Link TestFlight/Play build or demo video." },
        ],
      },
    ],
  },
  {
    id: "qa",
    title: "QA / SDET",
    category: "Engineering",
    blurb: "Quality strategy, automation, and risk coverage.",
    isDemo: true,
    stages: [
      {
        id: "manual",
        title: "Quality fundamentals",
        weeks: "2–3 weeks",
        skills: ["Test design", "Bug reports", "Exploratory", "Risk"],
        milestones: [
          { id: "q1", title: "Test plan for a feature", detail: "Happy, edge, and abuse cases." },
          { id: "q2", title: "High-signal bug report", detail: "Repro, expected, actual, severity." },
        ],
      },
      {
        id: "auto",
        title: "Automation",
        weeks: "4–5 weeks",
        skills: ["Playwright/Cypress", "API tests", "CI gates"],
        milestones: [
          { id: "q3", title: "E2E smoke suite", detail: "Critical user journeys in CI." },
          { id: "q4", title: "Apply to 8 roles", detail: "Show flaky-test reduction or coverage wins." },
        ],
      },
    ],
  },
  {
    id: "swe-general",
    title: "Software Engineer (Generalist)",
    category: "Engineering",
    blurb: "Broad CS fundamentals with flexible stack depth.",
    isDemo: true,
    stages: [
      {
        id: "cs",
        title: "CS core",
        weeks: "4–6 weeks",
        skills: ["DSA", "Complexity", "OOP", "Networking basics"],
        milestones: [
          { id: "g1", title: "100 DSA problems", detail: "Arrays, trees, graphs, DP starters." },
          { id: "g2", title: "Build a CLI tool", detail: "Parsing, file I/O, helpful errors." },
        ],
      },
      {
        id: "project",
        title: "Project depth",
        weeks: "4–6 weeks",
        skills: ["Web or systems", "Testing", "Collaboration"],
        milestones: [
          { id: "g3", title: "Capstone project", detail: "README, architecture diagram, demo." },
          { id: "g4", title: "Apply to 8 roles", detail: "Map projects to JD keywords honestly." },
        ],
      },
    ],
  },
];

export function getRoleById(id: string) {
  return CAREER_ROADMAP_ROLES.find((r) => r.id === id) ?? null;
}

export function getRoleByTitle(title: string) {
  const t = title.toLowerCase();
  return CAREER_ROADMAP_ROLES.find((r) => r.title.toLowerCase() === t) ?? null;
}
