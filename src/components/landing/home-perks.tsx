import Image from "next/image";
import {
  Bell,
  Clock3,
  Eye,
  PieChart,
  Tag,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { PERKS } from "@/data/home-content";
import { DS } from "@/data/dropship-assets";
import "./home-perks.css";

const ICONS: Record<(typeof PERKS)[number]["icon"], LucideIcon> = {
  calendar: Timer,
  clock: Clock3,
  receipt: Tag,
  chart: PieChart,
  alert: Bell,
  phone: Eye,
};

export function HomePerks() {
  return (
    <section className="cv-perks">
      <div className="cv-container">
        <div className="cv-eyebrow">
          <span className="cv-eyebrow-mark">CV</span>
          Signal before every interview
        </div>
        <h2 className="cv-section-title" style={{ marginTop: "0.85rem" }}>
          Perks of CareerVerse AI
        </h2>
        <p className="cv-section-sub">
          Built for recruiters and hiring teams who want clear signal before they interview.
        </p>
        <div className="cv-perks-grid">
          {PERKS.map((perk) => {
            const Icon = ICONS[perk.icon];
            return (
              <article key={perk.title} className="cv-perk-card">
                <div className="cv-perk-head">
                  <span className="cv-perk-glass">
                    <Icon size={22} aria-hidden />
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
