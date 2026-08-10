"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import "@/components/landing/events-discover.css";

type EventMode = "All" | "Online" | "In person" | "Hybrid";
type EventKind = "All" | "Demo" | "Workshop" | "Office hours" | "Panel" | "Tour";

type DiscoverEvent = {
  id: string;
  title: string;
  org: string;
  kind: Exclude<EventKind, "All">;
  mode: Exclude<EventMode, "All">;
  tags: string[];
  date: string;
  location: string;
  status: "Open" | "Soon" | "Featured";
  blurb: string;
  featured?: boolean;
};

const EVENTS: DiscoverEvent[] = [
  {
    id: "1",
    title: "Explainable scoring walkthrough",
    org: "CareerVerse",
    kind: "Demo",
    mode: "Online",
    tags: ["AI scoring", "Recruiting"],
    date: "Aug 18, 2026",
    location: "Online",
    status: "Featured",
    blurb: "See how resumes become clear strengths, gaps, and role fit—without opaque rankings.",
    featured: true,
  },
  {
    id: "2",
    title: "Voice interview lab",
    org: "CareerVerse",
    kind: "Workshop",
    mode: "Hybrid",
    tags: ["Voice", "Screening"],
    date: "Aug 22, 2026",
    location: "Online · Bengaluru hub",
    status: "Open",
    blurb: "Run a sample voice screen, review transcripts, and decide next steps with your team.",
    featured: true,
  },
  {
    id: "3",
    title: "Recruiter office hours",
    org: "CareerVerse Talent",
    kind: "Office hours",
    mode: "Online",
    tags: ["Hiring flow", "Alerts"],
    date: "Weekly",
    location: "Online",
    status: "Open",
    blurb: "Bring a live role. Map scoring, alerts, and interview stages to your process.",
    featured: true,
  },
  {
    id: "4",
    title: "Campus recruiting playbook",
    org: "BrightPath × CareerVerse",
    kind: "Panel",
    mode: "In person",
    tags: ["Campus", "Volume hiring"],
    date: "Sep 4, 2026",
    location: "Delhi NCR",
    status: "Soon",
    blurb: "Fair scoring and faster shortlists for campus teams hiring at scale.",
  },
  {
    id: "5",
    title: "Hiring alerts on Discord",
    org: "CareerVerse",
    kind: "Demo",
    mode: "Online",
    tags: ["Integrations", "Alerts"],
    date: "Sep 10, 2026",
    location: "Online",
    status: "Open",
    blurb: "Wire high-score candidates and interview outcomes into channels your team watches.",
  },
  {
    id: "6",
    title: "From apply to offer",
    org: "CareerVerse",
    kind: "Tour",
    mode: "Online",
    tags: ["Product tour", "Stages"],
    date: "Sep 16, 2026",
    location: "Online",
    status: "Open",
    blurb: "Track Applied → Screening → Interview → Offer for a sample role with real workflows.",
    featured: true,
  },
  {
    id: "7",
    title: "AI shortlist clinic",
    org: "Harbor Collective",
    kind: "Workshop",
    mode: "In person",
    tags: ["Shortlists", "Managers"],
    date: "Sep 24, 2026",
    location: "Mumbai",
    status: "Soon",
    blurb: "Hiring managers learn to read explainable scores and challenge weak fits together.",
  },
  {
    id: "8",
    title: "Silver medalist reactivation",
    org: "CareerVerse",
    kind: "Demo",
    mode: "Online",
    tags: ["Talent library", "Warm pool"],
    date: "Oct 2, 2026",
    location: "Online",
    status: "Open",
    blurb: "Re-engage past finalists with fresh role kits and match scores.",
  },
];

const MODES: EventMode[] = ["All", "Online", "In person", "Hybrid"];
const KINDS: EventKind[] = ["All", "Demo", "Workshop", "Office hours", "Panel", "Tour"];

export function EventsDiscover() {
  const [mode, setMode] = useState<EventMode>("All");
  const [kind, setKind] = useState<EventKind>("All");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => {
      if (mode !== "All" && e.mode !== mode) return false;
      if (kind !== "All" && e.kind !== kind) return false;
      if (q.trim()) {
        const hay = `${e.title} ${e.org} ${e.tags.join(" ")} ${e.blurb}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [mode, kind, q]);

  const featured = filtered.filter((e) => e.featured);
  const rest = filtered.filter((e) => !e.featured);

  return (
    <div className="cv-discover">
      <header className="cv-discover-hero">
        <div className="cv-discover-hero-inner">
          <p className="cv-discover-kicker">Discover</p>
          <h1>Events for recruiting teams</h1>
          <p>
            Demos, workshops, and office hours to score talent fairly, run voice screens, and keep hiring moving—built for
            CareerVerse.
          </p>
          <div className="cv-discover-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search demos, workshops, topics…"
              aria-label="Search events"
            />
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Start Free Trial</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="cv-discover-body">
        <div className="cv-discover-toolbar">
          <div className="cv-discover-filters" role="tablist" aria-label="Mode filters">
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                className={mode === m ? "is-active" : ""}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="cv-discover-filters is-soft" role="tablist" aria-label="Type filters">
            {KINDS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={kind === k}
                className={kind === k ? "is-active" : ""}
                onClick={() => setKind(k)}
              >
                {k}
              </button>
            ))}
          </div>
          <p className="cv-discover-count">{filtered.length} events found</p>
        </div>

        {featured.length ? (
          <section className="cv-discover-section">
            <h2>Featured</h2>
            <div className="cv-discover-grid is-featured">
              {featured.map((event) => (
                <EventCard key={event.id} event={event} large />
              ))}
            </div>
          </section>
        ) : null}

        <section className="cv-discover-section">
          <h2>All events</h2>
          <div className="cv-discover-grid">
            {(rest.length ? rest : filtered).map((event) => (
              <EventCard key={`all-${event.id}`} event={event} />
            ))}
            {!filtered.length ? (
              <div className="cv-discover-empty">
                <p>No events match these filters.</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("All");
                    setKind("All");
                    setQ("");
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        </section>

        <section className="cv-discover-cta">
          <h2>Want a private team session?</h2>
          <p>Invite recruiters and walk through your open roles live in CareerVerse.</p>
          <div className="cv-discover-cta-actions">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Create workspace</span>
            </Link>
            <Link href="/events/browse" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Browse workspace events</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function EventCard({ event, large }: { event: DiscoverEvent; large?: boolean }) {
  return (
    <article className={`cv-discover-card${large ? " is-large" : ""}`}>
      <div className="cv-discover-card-top">
        <span className="cv-discover-badge">{event.mode}</span>
        <span className={`cv-discover-status is-${event.status.toLowerCase()}`}>{event.status}</span>
      </div>
      <h3>{event.title}</h3>
      <p className="cv-discover-org">
        {event.org} · {event.kind}
      </p>
      <p className="cv-discover-blurb">{event.blurb}</p>
      <div className="cv-discover-tags">
        {event.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="cv-discover-meta">
        <span>
          <Calendar className="h-3.5 w-3.5" /> {event.date}
        </span>
        <span>
          <MapPin className="h-3.5 w-3.5" /> {event.location}
        </span>
        <span>
          <Users className="h-3.5 w-3.5" /> Teams welcome
        </span>
      </div>
      <Link href="/auth/signin" className="cv-discover-register">
        Register
      </Link>
    </article>
  );
}
