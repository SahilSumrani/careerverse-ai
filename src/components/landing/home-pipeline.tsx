"use client";

import { useEffect, useMemo, useState } from "react";
import { PipelineGlobe, type GlobeMarker } from "@/components/landing/pipeline-globe";
import "./home-pipeline.css";

type LiveItem = {
  id: string;
  name: string;
  role: string;
  stage: string;
  company?: string | null;
  at: string;
  source: "firestore" | "demo";
};

type StageStat = { title: string; count: number; note: string };

const DEMO_EVENTS: Omit<LiveItem, "id" | "at" | "source">[] = [
  { name: "Aisha", role: "Frontend Intern", stage: "Applied", company: "Harbor Collective" },
  { name: "Rohan", role: "Junior Frontend Engineer", stage: "Screening", company: "Northstar Labs" },
  { name: "Meera", role: "Data Analyst", stage: "Interview", company: "Orbit Finance" },
  { name: "Kabir", role: "People Ops Intern", stage: "Applied", company: "CareerVerse Partner Network" },
  { name: "Ananya", role: "ML Engineer (New Grad)", stage: "Offer", company: "Lumen AI" },
  { name: "Dev", role: "Backend Engineer Intern", stage: "Screening", company: "Riverbank Systems" },
  { name: "Priya", role: "UX Designer — Student Pathway", stage: "Interview", company: "SoftQA Studio" },
  { name: "Arjun", role: "Campus Recruiting Associate", stage: "Applied", company: "BrightPath" },
  { name: "Sara", role: "Marketing Intern", stage: "Applied", company: "BrightPath Campus" },
  { name: "Ishaan", role: "Data Science Intern", stage: "Screening", company: "Orbit Finance" },
];

const BASE_STAGES: StageStat[] = [
  { title: "Applied", count: 128, note: "New inbound this week" },
  { title: "Screening", count: 54, note: "AI scores ready" },
  { title: "Interview", count: 34, note: "Voice rounds booked" },
  { title: "Offer", count: 7, note: "Decisions this sprint" },
];

const GLOBE_MARKERS: GlobeMarker[] = [
  { lat: 40.71, lng: -74.01, label: "128 Applied", delay: 0.2 },
  { lat: 51.5, lng: -0.12, label: "54 Screening", delay: 0.5 },
  { lat: 28.63, lng: 77.22, label: "34 Interview", delay: 0.1 },
  { lat: 1.35, lng: 103.82, label: "7 Offer", delay: 0.8 },
  { lat: 37.77, lng: -122.4, label: "91% avg score", delay: 0.4 },
  { lat: 48.85, lng: 2.35, label: "22 Voice", delay: 0.7 },
  { lat: 35.69, lng: 139.69, label: "12 Final", delay: 1.0 },
  { lat: -33.87, lng: 151.21, label: "9 Hire", delay: 0.35 },
];

function relativeTime(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

function bumpStages(prev: StageStat[], stage: string): StageStat[] {
  return prev.map((s) => {
    if (s.title !== stage) return s;
    const next = s.count + 1;
    const notes: Record<string, string> = {
      Applied: "Live applications landing",
      Screening: "Scores refreshing",
      Interview: "Rounds filling up",
      Offer: "Offers moving out",
    };
    return { ...s, count: next, note: notes[s.title] || s.note };
  });
}

export function HomePipeline() {
  const [feed, setFeed] = useState<LiveItem[]>([]);
  const [stages, setStages] = useState(BASE_STAGES);
  const [usingDemo, setUsingDemo] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/activity/live");
        const data = await res.json();
        if (cancelled || !res.ok) return;
        const items = (data.items || []) as LiveItem[];
        if (items.length) {
          setFeed(items.slice(0, 8));
          setUsingDemo(Boolean(data.demo));
          const counts: Record<string, number> = { Applied: 0, Screening: 0, Interview: 0, Offer: 0 };
          for (const item of items) {
            if (counts[item.stage] != null) counts[item.stage] += 1;
          }
          if (!data.demo) {
            setStages((prev) =>
              prev.map((s) => ({
                ...s,
                count: Math.max(s.count, counts[s.title] ? s.count : s.count),
                note:
                  s.title === "Applied"
                    ? "From live applications"
                    : s.title === "Screening"
                      ? "In review now"
                      : s.title === "Interview"
                        ? "Rounds booked"
                        : "Closing soon",
              })),
            );
          }
        }
      } catch {
        /* keep demo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!usingDemo && feed.length) return;
    const seed: LiveItem[] = DEMO_EVENTS.slice(0, 5).map((e, i) => ({
      ...e,
      id: `seed-${i}`,
      at: new Date(Date.now() - i * 38_000).toISOString(),
      source: "demo",
    }));
    setFeed(seed);

    let i = 5;
    const id = window.setInterval(() => {
      const next = DEMO_EVENTS[i % DEMO_EVENTS.length];
      i += 1;
      const item: LiveItem = {
        ...next,
        id: `live-${Date.now()}`,
        at: new Date().toISOString(),
        source: "demo",
      };
      setFeed((prev) => [item, ...prev].slice(0, 8));
      setStages((prev) => bumpStages(prev, next.stage));
      setTick((t) => t + 1);
    }, 3200);
    return () => window.clearInterval(id);
  }, [usingDemo]);

  const headline = useMemo(() => {
    const top = feed[0];
    if (!top) return "Applications updating live";
    return `${top.name} · ${top.role}`;
  }, [feed, tick]);

  const markers = useMemo(() => {
    return GLOBE_MARKERS.map((m, idx) => {
      if (idx === 0) return { ...m, label: `${stages[0].count} Applied` };
      if (idx === 1) return { ...m, label: `${stages[1].count} Screening` };
      if (idx === 2) return { ...m, label: `${stages[2].count} Interview` };
      if (idx === 3) return { ...m, label: `${stages[3].count} Offer` };
      return m;
    });
  }, [stages]);

  return (
    <section className="cv-pipe">
      <div className="cv-pipe-head">
        <div className="cv-eyebrow" style={{ margin: "0 auto" }}>
          <span className="cv-eyebrow-mark">CV</span>
          Live applications
        </div>
        <h2 className="cv-section-title" style={{ marginTop: "1rem" }}>
          Track candidates across every stage live
        </h2>
        <p className="cv-section-sub">
          Watch Applied → Screening → Interview → Offer for every role—without leaving CareerVerse AI.
        </p>
      </div>

      <div className="cv-pipe-globe-wrap">
        <PipelineGlobe markers={markers} />

        <div className="cv-pipe-live" aria-live="polite">
          <div className="cv-pipe-live-head">
            <span className="cv-pipe-live-dot" aria-hidden />
            <strong>{usingDemo ? "Demo live feed" : "Live from applications"}</strong>
            <em key={headline}>{headline}</em>
          </div>
          <ul className="cv-pipe-feed">
            {feed.map((item) => (
              <li key={item.id} className="cv-pipe-feed-item">
                <div>
                  <strong>
                    {item.name} applied · {item.role}
                  </strong>
                  <span>
                    {item.stage}
                    {item.company ? ` · ${item.company}` : ""}
                  </span>
                </div>
                <time dateTime={item.at}>{relativeTime(item.at)}</time>
              </li>
            ))}
          </ul>
        </div>

        <div className="cv-pipe-overlay">
          {stages.map((s) => (
            <div key={s.title} className="cv-pipe-stat">
              <span>{s.title}</span>
              <strong key={`${s.title}-${s.count}`}>{s.count}</strong>
              <em>{s.note}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
