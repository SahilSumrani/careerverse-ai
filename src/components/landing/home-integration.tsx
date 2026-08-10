import Image from "next/image";
import Link from "next/link";
import { FunnelGlow } from "@/components/landing/funnel-glow";
import { DS } from "@/data/dropship-assets";
import "./home-integration.css";

export function HomeIntegration() {
  return (
    <section className="cv-integ">
      <div className="cv-integ-inner">
        <div className="cv-integ-stars" aria-label="4.9 out of 5 from recruiters">
          <span className="cv-integ-stars-text">4.9 · 2,400+ recruiters</span>
        </div>
        <h2 className="cv-section-title">Slack & Discord alerts</h2>
        <p className="cv-section-sub">
          Get notified the moment a high-score candidate applies, finishes a voice interview, or needs a hiring decision.
        </p>
        <Link href="/auth/signup" className="cv-btn-wrap cv-integ-cta">
          <span className="cv-btn">Connect alerts</span>
        </Link>
      </div>

      <div className="cv-integ-funnel">
        <FunnelGlow
          size="md"
          badge={
            <div className="cv-funnel-badge-inner cv-integ-badge">
              <Image src={DS.chromeWebp} alt="" width={52} height={52} unoptimized />
            </div>
          }
        />
      </div>
    </section>
  );
}
