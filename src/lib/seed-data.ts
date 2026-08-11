/** Demo / seed payloads when Firestore collections are empty. */

export const SEED_POSTS = [
  {
    id: "seed-post-1",
    title: "How I used Career Intelligence to pick a target role",
    content:
      "Ran analysis after onboarding, picked the top path with the fewest skill gaps, and added those gaps to my roadmap. Happy to share the process.",
    category: "CAREER",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    author: { id: "demo-author-1", name: "Aisha K.", image: null },
    _count: { comments: 2, reactions: 8 },
  },
  {
    id: "seed-post-2",
    title: "Resume ATS tips that actually helped",
    content:
      "Kept a single-column layout, quantified 3 bullets, and aligned keywords to one target role. Resume Intelligence score jumped after a re-upload.",
    category: "JOBS",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    author: { id: "demo-author-2", name: "Rohan M.", image: null },
    _count: { comments: 1, reactions: 12 },
  },
  {
    id: "seed-post-3",
    title: "Looking for mock interview partners (frontend)",
    content:
      "Anyone free this weekend for a 30-min React/TS mock? I can swap behavioral practice.",
    category: "INTERVIEWS",
    isDemo: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    author: { id: "demo-author-3", name: "Priya S.", image: null },
    _count: { comments: 4, reactions: 5 },
  },
];

export const SEED_EVENTS = [
  {
    id: "seed-evt-1",
    title: "Campus-to-Career panel: product & eng",
    organizationName: "CareerVerse Community",
    location: "Online",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 90).toISOString(),
    type: "Panel",
    blurb: "Hear from early-career PMs and engineers on portfolios, internships, and first roles.",
    isDemo: true,
  },
  {
    id: "seed-evt-2",
    title: "Resume lab: ATS-friendly rewrite sprint",
    organizationName: "CareerVerse Mentors",
    location: "Bangalore + Online",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12 + 1000 * 60 * 120).toISOString(),
    type: "Workshop",
    blurb: "Live rewrite clinic with mentors. Bring a PDF/DOCX and a target role.",
    isDemo: true,
  },
  {
    id: "seed-evt-3",
    title: "Mock interview night (DSA + behavioral)",
    organizationName: "Harbor Collective",
    location: "Remote",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 18 + 1000 * 60 * 150).toISOString(),
    type: "Meetup",
    blurb: "Paired practice rounds with structured feedback. Open to students and new grads.",
    isDemo: true,
  },
];

export const SEED_MENTORS = [
  {
    id: "seed-mentor-1",
    name: "Neha Kapoor",
    headline: "Senior Frontend Engineer · ex-Flipkart",
    skills: ["React", "TypeScript", "System design"],
    focus: "Frontend careers & portfolios",
    availability: "Weekends",
    isDemo: true,
  },
  {
    id: "seed-mentor-2",
    name: "Arjun Desai",
    headline: "Product Manager · B2B SaaS",
    skills: ["Product sense", "Roadmapping", "Stakeholder mgmt"],
    focus: "PM transitions from eng/analytics",
    availability: "Evenings",
    isDemo: true,
  },
  {
    id: "seed-mentor-3",
    name: "Sara Iqbal",
    headline: "Data Scientist · Healthcare AI",
    skills: ["Python", "SQL", "ML ops"],
    focus: "Analytics → DS paths",
    availability: "Flexible",
    isDemo: true,
  },
];

export function seedNotifications(userName?: string | null) {
  const name = userName?.split(" ")[0] || "there";
  return [
    {
      id: "seed-notif-1",
      type: "SYSTEM",
      title: "Onboarding complete",
      body: `Nice work, ${name}. Your profile is ready for Career Intelligence and matching.`,
      href: "/career",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      isDemo: true,
    },
    {
      id: "seed-notif-2",
      type: "OPPORTUNITY_ALERT",
      title: "New job match",
      body: "A Junior Frontend Engineer role scored highly against your skills.",
      href: "/opportunities/browse",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      isDemo: true,
    },
    {
      id: "seed-notif-3",
      type: "SYSTEM",
      title: "Resume uploaded",
      body: "Your latest resume is available in Resume Intelligence for analysis.",
      href: "/resume",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      isDemo: true,
    },
  ];
}
