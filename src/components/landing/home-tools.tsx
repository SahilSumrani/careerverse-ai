"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_TOOLS } from "@/data/home-content";
import { CV_ICONS } from "@/data/cv-icons";
import "./home-tools.css";

/** Match rail icons to tool ids (HOME_TOOLS order ≠ CV_ICONS order). */
const TOOL_ICON: Record<string, string> = {
  scoring: CV_ICONS[0],
  resume: CV_ICONS[1],
  voice: CV_ICONS[2],
  magic: CV_ICONS[3],
  scheduler: CV_ICONS[4],
  discord: CV_ICONS[5],
  hubspot: CV_ICONS[5],
  talent: CV_ICONS[6],
  analytics: CV_ICONS[7],
  roles: CV_ICONS[8],
};

const PREVIEW_META: Record<
  string,
  { eyebrow: string; metric: string; metricLabel: string; rows: { label: string; value: string; tone?: "good" | "warn" | "mute" }[] }
> = {
  voice: {
    eyebrow: "Interview room",
    metric: "86",
    metricLabel: "Comm. score",
    rows: [
      { label: "Structure", value: "Strong", tone: "good" },
      { label: "Depth", value: "Good", tone: "good" },
      { label: "Role fit", value: "Review", tone: "warn" },
    ],
  },
  resume: {
    eyebrow: "Resume parse",
    metric: "12",
    metricLabel: "Skills mapped",
    rows: [
      { label: "Experience", value: "4 yrs", tone: "mute" },
      { label: "Alignment", value: "91%", tone: "good" },
      { label: "Gaps", value: "2 flagged", tone: "warn" },
    ],
  },
  roles: {
    eyebrow: "Role bank",
    metric: "8",
    metricLabel: "Active kits",
    rows: [
      { label: "ML Engineer", value: "Weighted", tone: "good" },
      { label: "Product Design", value: "Draft", tone: "mute" },
      { label: "Backend", value: "Live", tone: "good" },
    ],
  },
  analytics: {
    eyebrow: "Hiring funnel",
    metric: "34%",
    metricLabel: "Interview rate",
    rows: [
      { label: "Applied", value: "248", tone: "mute" },
      { label: "Screened", value: "112", tone: "mute" },
      { label: "Offers", value: "9", tone: "good" },
    ],
  },
  scoring: {
    eyebrow: "Match score",
    metric: "94%",
    metricLabel: "Explainable",
    rows: [
      { label: "Skills", value: "+28", tone: "good" },
      { label: "Tenure", value: "+12", tone: "good" },
      { label: "Gaps", value: "−6", tone: "warn" },
    ],
  },
  scheduler: {
    eyebrow: "Panel calendar",
    metric: "5",
    metricLabel: "Slots this week",
    rows: [
      { label: "Tue 2:00p", value: "Booked", tone: "good" },
      { label: "Wed 11:00a", value: "Open", tone: "mute" },
      { label: "Thu 4:30p", value: "Hold", tone: "warn" },
    ],
  },
  hubspot: {
    eyebrow: "CRM sync",
    metric: "OK",
    metricLabel: "Last sync",
    rows: [
      { label: "Contacts", value: "142", tone: "mute" },
      { label: "Stages", value: "Mapped", tone: "good" },
      { label: "Errors", value: "0", tone: "good" },
    ],
  },
  discord: {
    eyebrow: "Team alerts",
    metric: "3",
    metricLabel: "Unread pings",
    rows: [
      { label: "#hiring", value: "Score 92+", tone: "good" },
      { label: "#design", value: "New apply", tone: "mute" },
      { label: "#eng", value: "Decision", tone: "warn" },
    ],
  },
  magic: {
    eyebrow: "AI search",
    metric: "24",
    metricLabel: "In shortlist",
    rows: [
      { label: "Query", value: "React + SQL", tone: "mute" },
      { label: "Location", value: "Remote", tone: "mute" },
      { label: "Min score", value: "85%", tone: "good" },
    ],
  },
  talent: {
    eyebrow: "Talent library",
    metric: "1.2k",
    metricLabel: "Warm profiles",
    rows: [
      { label: "Silver medals", value: "86", tone: "good" },
      { label: "Tagged", value: "340", tone: "mute" },
      { label: "Re-engage", value: "12 due", tone: "warn" },
    ],
  },
};

function ToolPreview({ toolId, title }: { toolId: string; title: string }) {
  const meta = PREVIEW_META[toolId] ?? PREVIEW_META.roles;

  return (
    <div className="cv-tabs-preview" aria-hidden>
      <div className="cv-tabs-preview-chrome">
        <span className="cv-tabs-preview-dot" />
        <span className="cv-tabs-preview-dot" />
        <span className="cv-tabs-preview-dot" />
        <span className="cv-tabs-preview-brand">CareerVerse AI</span>
      </div>
      <div className="cv-tabs-preview-body">
        <div className="cv-tabs-preview-top">
          <div>
            <p className="cv-tabs-preview-eyebrow">{meta.eyebrow}</p>
            <p className="cv-tabs-preview-title">{title}</p>
          </div>
          <div className="cv-tabs-preview-metric">
            <strong>{meta.metric}</strong>
            <span>{meta.metricLabel}</span>
          </div>
        </div>
        <ul className="cv-tabs-preview-rows">
          {meta.rows.map((row) => (
            <li key={row.label}>
              <span>{row.label}</span>
              <em data-tone={row.tone ?? "mute"}>{row.value}</em>
            </li>
          ))}
        </ul>
        <div className="cv-tabs-preview-bars">
          <span style={{ width: "78%" }} />
          <span style={{ width: "62%" }} />
          <span style={{ width: "88%" }} />
        </div>
      </div>
    </div>
  );
}

export function HomeTools() {
  const [active, setActive] = useState(() =>
    Math.max(
      0,
      HOME_TOOLS.findIndex((t) => t.id === "scoring"),
    ),
  );
  const paused = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (paused.current) return;
      setActive((i) => (i + 1) % HOME_TOOLS.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const tool = HOME_TOOLS[active];
  const iconSrc = TOOL_ICON[tool.id] ?? CV_ICONS[active % CV_ICONS.length];

  return (
    <section className="cv-tabs" id="for-recruiters">
      <div className="cv-tabs-spotlight" aria-hidden />
      <div className="cv-tabs-head">
        <p className="cv-tabs-kicker">For recruiters</p>
        <h2 className="cv-section-title">CareerVerse hiring tools</h2>
        <p className="cv-section-sub">
          Scoring, voice interviews, Magic AI Search, and hiring flow—every recruiting tool in one account.
        </p>
      </div>

      <div className="cv-tabs-rail-wrap">
        <div className="cv-tabs-rail">
          {HOME_TOOLS.map((t, i) => {
            const selected = i === active;
            const src = TOOL_ICON[t.id] ?? CV_ICONS[i % CV_ICONS.length];
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.title}
                className={`cv-tab-btn${selected ? " is-active" : ""}`}
                onClick={() => {
                  paused.current = true;
                  setActive(i);
                }}
                onMouseEnter={() => {
                  paused.current = true;
                }}
                onMouseLeave={() => {
                  paused.current = false;
                }}
              >
                {selected ? <span className="cv-tab-tip">{t.title}</span> : null}
                <Image src={src} alt="" width={40} height={40} className="cv-tab-icon" unoptimized />
              </button>
            );
          })}
        </div>
      </div>

      <div className="cv-tabs-panel">
        <div className="cv-tabs-card">
          <div className="cv-tabs-main">
            <div className="cv-tabs-badge is-asset">
              <Image src={iconSrc} alt="" width={48} height={48} unoptimized />
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link href={tool.href} className="cv-tabs-link">
              <span>View feature</span>
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="cv-tabs-side">
            <div className="cv-tabs-shot">
              <ToolPreview toolId={tool.id} title={tool.title} />
            </div>
          </div>
          <div className="cv-tabs-footer" style={{ gridColumn: "1 / -1" }}>
            {tool.points.map((p) => (
              <div key={`f-${p.title}`}>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
