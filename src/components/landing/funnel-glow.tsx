"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type FunnelGlowProps = {
  className?: string;
  badge?: React.ReactNode;
  invert?: boolean;
  size?: "sm" | "md" | "lg";
};

export function FunnelGlow({ className, badge, invert, size = "md" }: FunnelGlowProps) {
  const uid = useId().replace(/:/g, "");

  // Default: wide-top → narrow-bottom
  // Invert (Dropship hero pedestal): narrow under badge → wide toward bottom, with white space at sides
  const points = invert ? "44,5 56,5 76,108 24,108" : "6,4 94,4 58,128 42,128";

  return (
    <div
      className={cn(
        "cv-funnel",
        invert && "cv-funnel-invert",
        size === "sm" && "cv-funnel-sm",
        size === "lg" && "cv-funnel-lg",
        className,
      )}
      aria-hidden
    >
      <svg className="cv-funnel-svg" viewBox="0 0 100 140" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0" y1="0" x2="0" y2="1">
            {invert ? (
              <>
                <stop offset="0%" stopColor="#93b4ff" stopOpacity="0.12" />
                <stop offset="22%" stopColor="#7ea4ff" stopOpacity="0.38" />
                <stop offset="55%" stopColor="#5f8cff" stopOpacity="0.48" />
                <stop offset="82%" stopColor="#225aea" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#225aea" stopOpacity="0" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#a7c4ff" stopOpacity="0.42" />
                <stop offset="30%" stopColor="#7ea4ff" stopOpacity="0.5" />
                <stop offset="65%" stopColor="#5f8cff" stopOpacity="0.58" />
                <stop offset="100%" stopColor="#225aea" stopOpacity="0.7" />
              </>
            )}
          </linearGradient>
          <filter id={`${uid}-blur`} x="-20%" y="-12%" width="140%" height="130%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={invert ? "3.2" : "2.4"} />
          </filter>
        </defs>
        <polygon points={points} fill={`url(#${uid}-grad)`} filter={`url(#${uid}-blur)`} />
      </svg>
      <div className="cv-funnel-glow" />
      <div className="cv-funnel-beam" />
      {badge ? <div className="cv-funnel-badge">{badge}</div> : null}
    </div>
  );
}
