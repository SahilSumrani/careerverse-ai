import "./home-lane.css";

type Props = {
  audience: "recruiters" | "candidates";
  id?: string;
  title: string;
  lead: string;
};

export function HomeLane({ audience, id, title, lead }: Props) {
  return (
    <div
      id={id}
      className={`cv-lane cv-lane-${audience}`}
      data-audience={audience}
    >
      <div className="cv-lane-inner">
        <p className="cv-lane-badge">
          {audience === "recruiters" ? "For recruiters" : "For candidates"}
        </p>
        <h2 className="cv-lane-title">{title}</h2>
        <p className="cv-lane-lead">{lead}</p>
      </div>
    </div>
  );
}
