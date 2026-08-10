import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DS } from "@/data/dropship-assets";
import "./home-feature-strip.css";

export function HomeFeatureStrip() {
  return (
    <section className="cv-strip">
      <div className="cv-container cv-strip-grid">
        <article className="cv-strip-card">
          <h3>Your talent bank</h3>
          <p>Search candidates by skills, location, AI scores, and interview stage—in one CareerVerse library.</p>
          <Link href="/network" className="cv-strip-link">
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="cv-strip-art cv-strip-art-photo" aria-hidden>
            <Image
              src={DS.stripMillions}
              alt=""
              width={480}
              height={280}
              className="cv-strip-photo"
              unoptimized
            />
          </div>
        </article>

        <article className="cv-strip-card">
          <h3>Track your hiring flow</h3>
          <p>Watch Applied → Screening → Interview → Offer update live for every open role.</p>
          <Link href="/hiring-flow" className="cv-strip-link">
            Learn More <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="cv-strip-art cv-strip-art-photo" aria-hidden>
            <Image
              src={DS.stripTrack}
              alt=""
              width={480}
              height={280}
              className="cv-strip-photo"
              unoptimized
            />
          </div>
        </article>
      </div>
    </section>
  );
}
