import Image from "next/image";
import { PERKS } from "@/data/home-content";
import { DS } from "@/data/dropship-assets";
import "./home-perks.css";

export function HomePerks() {
  return (
    <section className="cv-perks">
      <div className="cv-container">
        <div className="cv-eyebrow">
          <span className="cv-eyebrow-mark">CV</span>
          CareerVerse AI is live!
        </div>
        <h2 className="cv-section-title" style={{ marginTop: "0.85rem" }}>
          Perks of CareerVerse AI
        </h2>
        <p className="cv-section-sub">
          Built for recruiters and hiring teams who want clear signal before they interview.
        </p>
        <div className="cv-perks-grid">
          {PERKS.map((perk) => (
            <article key={perk.title} className="cv-perk-card">
              <div className="cv-perk-head">
                <span className="cv-perk-glass">
                  <Image src={DS.glassIcons[perk.icon]} alt="" width={36} height={36} unoptimized />
                </span>
                <h3>{perk.title}</h3>
              </div>
              <p>{perk.text}</p>
              <div className="cv-perk-visual">
                <Image
                  src={DS.perkArt[perk.icon]}
                  alt=""
                  width={200}
                  height={140}
                  className="cv-perk-photo"
                  unoptimized
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
