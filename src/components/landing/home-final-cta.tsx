"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { CV_ICONS } from "@/data/cv-icons";
import "./home-final-cta.css";

/**
 * Dropship scrape closing (index.html + odyn bundle `at()`):
 * 1) White cta_list — arc via rotate/y (transform-origin bottom), hover scale 1.2 + tooltip
 * 2) footer_component — footer_graphic + Ready to begin? + white button
 *
 * Breakpoints from Dropship odyn:
 *   ≤479: rot 8 / drop 20 | ≤767: 12/30 | ≤991: 15/38 | else: 18/48
 */
const CTA_ITEMS = [
  { src: CV_ICONS[2], label: "Voice Interviews", href: "/auth/signup" },
  { src: CV_ICONS[1], label: "Resume Parser", href: "/resume" },
  { src: CV_ICONS[0], label: "Candidate Scoring", href: "/career" },
  { src: CV_ICONS[7], label: "Analytics", href: "/dashboard" },
  { src: CV_ICONS[5], label: "Hiring Alerts", href: "/hiring-flow" },
  { src: CV_ICONS[6], label: "Talent Library", href: "/network" },
  { src: CV_ICONS[4], label: "Interview Scheduler", href: "/hiring-flow" },
  { src: CV_ICONS[3], label: "Magic AI Search", href: "/copilot" },
  { src: CV_ICONS[8], label: "Network", href: "/network" },
  { src: CV_ICONS[9], label: "Mentors", href: "/mentors" },
] as const;

function arcParams(width: number) {
  if (width <= 479) return { maxRotation: 8, arcDrop: 20 };
  if (width <= 767) return { maxRotation: 12, arcDrop: 30 };
  if (width <= 991) return { maxRotation: 15, arcDrop: 38 };
  return { maxRotation: 18, arcDrop: 48 };
}

export function HomeFinalCta() {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const intensityRef = useRef(0.25);
  const hoveredRef = useRef<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const apply = (intensity: number) => {
      intensityRef.current = intensity;
      const items = itemRefs.current.filter(Boolean) as HTMLLIElement[];
      if (!items.length) return;
      const g = (items.length - 1) / 2;
      const { maxRotation, arcDrop } = arcParams(window.innerWidth);

      items.forEach((el, n) => {
        const l = g > 0 ? (n - g) / g : 0;
        const rotation = l * maxRotation * intensity;
        const y = l * l * arcDrop * intensity;
        const scale = hoveredRef.current === n ? 1.2 : 1;
        el.style.zIndex = hoveredRef.current === n ? "20" : String(n + 1);
        el.style.transformOrigin = "bottom center";
        el.style.transform = `translate(0px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
      });
    };

    apply(0.25);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        const start = performance.now();
        const from = intensityRef.current;
        const to = 1;
        const dur = 1000;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          // approximate back.out(1.4)
          const overshoot = 1.4;
          const c1 = overshoot + 1;
          const eased = 1 + c1 * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
          apply(from + (to - from) * Math.min(1, eased));
          if (t < 1) requestAnimationFrame(tick);
          else apply(1);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      },
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(list);

    const onResize = () => apply(intensityRef.current);
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const setHover = (index: number | null) => {
    hoveredRef.current = index;
    const items = itemRefs.current.filter(Boolean) as HTMLLIElement[];
    const g = (items.length - 1) / 2;
    const { maxRotation, arcDrop } = arcParams(window.innerWidth);
    const intensity = intensityRef.current;

    items.forEach((el, n) => {
      const l = g > 0 ? (n - g) / g : 0;
      const rotation = l * maxRotation * intensity;
      const y = l * l * arcDrop * intensity;
      const scale = index === n ? 1.2 : 1;
      el.style.zIndex = index === n ? "20" : String(n + 1);
      el.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
      el.style.transform = `translate(0px, ${y}px) rotate(${rotation}deg) scale(${scale})`;
    });
  };

  return (
    <>
      <section className="cv-final-mid">
        <div className="cv-final-mid-inner">
          <ul ref={listRef} className="cv-final-cta-list">
            {CTA_ITEMS.map((item, i) => (
              <li
                key={item.src}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="cv-final-cta-item"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <Link href={item.href} className="cv-final-cta-link" aria-label={item.label}>
                  <Image src={item.src} alt="" width={96} height={96} className="cv-final-cta-img" unoptimized />
                </Link>
                <span className="cv-final-cta-tooltip">{item.label}</span>
              </li>
            ))}
          </ul>

          <div className="cv-final-mid-heading">
            <h2>Hire your next role with CareerVerse AI</h2>
            <p>
              AI scoring, voice interviews, and hiring alerts—built for recruiters who want signal before
              they interview.
            </p>
          </div>
        </div>
      </section>

      <section className="cv-final">
        <div className="cv-final-top">
          <div className="cv-final-heading">
            <h2>Ready to begin?</h2>
            <p>Start your free trial and shortlist stronger candidates today.</p>
            <Link href="/auth/signup" className="cv-final-btn">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
