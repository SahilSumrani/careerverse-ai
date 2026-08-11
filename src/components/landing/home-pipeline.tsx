import "./home-pipeline.css";

const STAGES = [
  { title: "Applied", count: 128, note: "From live applications" },
  { title: "Screening", count: 54, note: "In review now" },
  { title: "Interview", count: 34, note: "Rounds booked" },
  { title: "Offer", count: 7, note: "Closing soon" },
] as const;

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

      <div className="cv-pipe-stages" aria-label="Hiring stages">
        {STAGES.map((s) => (
          <div key={s.title} className="cv-pipe-stat">
            <span>{s.title}</span>
            <strong>{s.count}</strong>
            <em>{s.note}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
