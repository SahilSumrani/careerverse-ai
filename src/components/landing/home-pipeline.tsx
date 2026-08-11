"use client";

import { PipelineGlobe, type GlobeMarker } from "@/components/landing/pipeline-globe";
import "./home-pipeline.css";

const STAGES = [
  { title: "Applied", count: 128, note: "From live applications" },
  { title: "Screening", count: 54, note: "In review now" },
  { title: "Interview", count: 34, note: "Rounds booked" },
  { title: "Offer", count: 7, note: "Closing soon" },
] as const;

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

export function HomePipeline() {
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
        <PipelineGlobe markers={GLOBE_MARKERS} />

        <div className="cv-pipe-overlay" aria-label="Hiring stages">
          {STAGES.map((s) => (
            <div key={s.title} className="cv-pipe-stat">
              <span>{s.title}</span>
              <strong>{s.count}</strong>
              <em>{s.note}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
