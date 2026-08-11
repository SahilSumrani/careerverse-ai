"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { COMPANY_MARQUEE, type CompanyMarqueeCard } from "@/data/home-content";
import { DS } from "@/data/dropship-assets";
import { CV_HERO_ICONS } from "@/data/cv-icons";
import "./home-hero.css";

/**
 * Dropship-style product tunnel adapted for CareerVerse:
 * - 3 curved rows (bowl / straight / arch)
 * - two panels per track (seamless -50% loop)
 * - company cards pass behind CV hub along vertical beam
 * - left = skeleton, right = filled (clip-path across center)
 * - near-hub scale/fade so cards feel like they enter the node
 */

type Curve = "bowl" | "straight" | "arch";

function CompanyLogo({ item }: { item: CompanyMarqueeCard }) {
  if (item.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.logoUrl} alt="" className="cv-marquee-img" width={54} height={54} />
    );
  }
  return (
    <span className="cv-marquee-logo" style={{ background: `${item.tint}18`, color: item.tint }}>
      {item.initials}
    </span>
  );
}

function MarqueeCard({ item }: { item: CompanyMarqueeCard }) {
  return (
    <div className="cv-marquee-item" data-cv-marquee-item="">
      <div className="cv-marquee-img-wrap">
        <CompanyLogo item={item} />
      </div>
      <div className="cv-marquee-text">
        <p className="cv-marquee-name">{item.company}</p>
        <p className="cv-marquee-meta">{item.role}</p>
      </div>
      <div className="cv-marquee-line" />
      <div className="cv-marquee-text is-right">
        <p className="cv-marquee-score">{item.kind}</p>
        <p className="cv-marquee-meta is-brand">{item.badge}</p>
      </div>

      <div className="cv-marquee-skeleton" aria-hidden>
        <div className="cv-marquee-img-wrap">
          <span className="cv-marquee-img-skel" />
        </div>
        <div className="cv-marquee-text">
          <span className="cv-skel-line is-lg" />
          <span className="cv-skel-line is-sm" />
        </div>
        <div className="cv-marquee-line" />
        <div className="cv-marquee-text is-right">
          <span className="cv-skel-line is-md" />
          <span className="cv-skel-pill" />
        </div>
      </div>
    </div>
  );
}

function MarqueePanel({
  items,
  offset,
}: {
  items: CompanyMarqueeCard[];
  offset: number;
}) {
  return (
    <div className="cv-hero-marquee-panel">
      <div className="cv-hero-marquee-list">
        {items.map((item, i) => (
          <MarqueeCard key={`${offset}-${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  offset,
  reversed,
  curve,
}: {
  items: CompanyMarqueeCard[];
  offset: number;
  reversed?: boolean;
  curve: Curve;
}) {
  return (
    <div className="cv-hero-marquee-layout" data-curve={curve}>
      <div className={`cv-hero-marquee-track${reversed ? " is-reversed" : ""}`} data-cv-marquee-track="">
        <MarqueePanel items={items} offset={offset} />
        <MarqueePanel items={items} offset={offset + 3} />
      </div>
    </div>
  );
}

function easePower4Out(t: number) {
  return 1 - (1 - t) ** 4;
}

function easePower2Out(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export function HomeHero() {
  const visualRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const burstingRef = useRef(false);
  const animCacheRef = useRef<Animation[]>([]);

  const rowA = COMPANY_MARQUEE.slice(0, 9);
  const rowB = [...COMPANY_MARQUEE.slice(3, 9), ...COMPANY_MARQUEE.slice(0, 3)];
  const rowC = [...COMPANY_MARQUEE.slice(6), ...COMPANY_MARQUEE.slice(0, 6)];

  const refreshAnims = useCallback(() => {
    const root = visualRef.current;
    if (!root) return [];
    const anims = [...root.querySelectorAll<HTMLElement>("[data-cv-marquee-track]")].flatMap((t) =>
      t.getAnimations(),
    );
    animCacheRef.current = anims;
    return anims;
  }, []);

  const setRate = useCallback(
    (rate: number) => {
      const anims = animCacheRef.current.length ? animCacheRef.current : refreshAnims();
      anims.forEach((anim) => {
        anim.playbackRate = rate;
      });
    },
    [refreshAnims],
  );

  useEffect(() => {
    const root = visualRef.current;
    if (!root) return;

    let alive = true;
    let intersecting = true;
    let rafId = 0;

    const applyPad = () => {
      const pad = window.innerWidth <= 767 ? 52 : 120;
      root.querySelectorAll<HTMLElement>("[data-curve]").forEach((layout) => {
        layout.style.paddingTop = `${pad}px`;
        layout.style.paddingBottom = `${pad}px`;
        layout.style.marginTop = `-${pad}px`;
        layout.style.marginBottom = `-${pad}px`;
      });
    };
    applyPad();
    window.addEventListener("resize", applyPad);

    refreshAnims();

    const io = new IntersectionObserver(
      ([entry]) => {
        intersecting = !!entry?.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(root);

    const tick = () => {
      if (!alive) return;

      if (intersecting) {
        const box = root.getBoundingClientRect();
        const mid = box.left + box.width / 2;
        const radius = window.innerWidth <= 767 ? 2200 : 4200;
        // Distance over which cards shrink into / emerge from the CV hub
        const tunnelReach = window.innerWidth <= 767 ? 110 : 150;

        root.querySelectorAll<HTMLElement>("[data-curve]").forEach((layout) => {
          const curve = (layout.dataset.curve || "straight") as Curve;

          layout.querySelectorAll<HTMLElement>("[data-cv-marquee-item]").forEach((item) => {
            const track = item.closest<HTMLElement>("[data-cv-marquee-track]");
            if (!track) return;

            const trackRect = track.getBoundingClientRect();
            const layoutW = item.offsetWidth || 1;
            const centerX = trackRect.left + item.offsetLeft + layoutW / 2;
            const dx = centerX - mid;
            const skel = item.querySelector<HTMLElement>(".cv-marquee-skeleton");

            // Through-hub tunnel: scale + opacity dip at center (cards enter CV, exit other side)
            const proximity = Math.min(1, Math.abs(dx) / tunnelReach);
            const throughScale = 0.55 + 0.45 * proximity;
            const throughOpacity = 0.28 + 0.72 * proximity;

            let y = 0;
            let rot = 0;
            if (curve !== "straight") {
              const clamped = Math.min(Math.abs(dx), radius);
              const hyp = Math.sqrt(Math.max(1, radius * radius - clamped * clamped));
              const rise = hyp - radius;
              const angle = (Math.atan2(clamped, hyp) * 180) / Math.PI;
              const sign = dx === 0 ? 0 : Math.sign(dx);
              y = curve === "bowl" ? rise : -rise;
              rot = curve === "bowl" ? -sign * angle : sign * angle;
            }

            item.style.transform = `translate3d(0, ${y}px, 0) rotate(${rot}deg) scale(${throughScale})`;
            item.style.opacity = String(throughOpacity);

            if (skel) {
              const right = trackRect.left + item.offsetLeft + layoutW;
              const x = Math.max(0, Math.min(1, (right - mid) / layoutW));
              skel.style.clipPath = `inset(0 ${Math.round(x * layoutW)}px 0 0 round 12px)`;
            }
          });
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(rafId);
      io.disconnect();
      window.removeEventListener("resize", applyPad);
    };
  }, [refreshAnims]);

  const onIconEnter = useCallback(() => {
    const icon = iconRef.current;
    if (!icon || burstingRef.current) return;
    icon.style.transform = "translate(-50%, -50%) scale(0.95)";
  }, []);

  const onIconLeave = useCallback(() => {
    const icon = iconRef.current;
    if (!icon || burstingRef.current) return;
    icon.style.transform = "translate(-50%, -50%) scale(1)";
  }, []);

  const onIconClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (burstingRef.current) return;
      burstingRef.current = true;

      const icon = iconRef.current;
      if (icon) {
        icon.style.transform = "translate(-50%, -50%) scale(1.1)";
        window.setTimeout(() => {
          if (icon) icon.style.transform = "translate(-50%, -50%) scale(1)";
        }, 180);
      }

      refreshAnims();

      const unlock = window.setTimeout(() => {
        burstingRef.current = false;
        setRate(1);
      }, 2500);

      const rampStart = performance.now();
      const ramp = (now: number) => {
        const t = Math.min(1, (now - rampStart) / 500);
        setRate(1 + (20 - 1) * easePower4Out(t));
        if (t < 1) {
          requestAnimationFrame(ramp);
          return;
        }
        window.setTimeout(() => {
          const easeStart = performance.now();
          const ease = (n: number) => {
            const u = Math.min(1, (n - easeStart) / 1000);
            setRate(20 + (1 - 20) * easePower2Out(u));
            if (u < 1) {
              requestAnimationFrame(ease);
            } else {
              window.clearTimeout(unlock);
              setRate(1);
              burstingRef.current = false;
            }
          };
          requestAnimationFrame(ease);
        }, 400);
      };
      requestAnimationFrame(ramp);
    },
    [refreshAnims, setRate],
  );

  return (
    <section className="cv-hero">
      <div className="cv-hero-copy">
        <ul className="cv-hero-icon-arc" aria-label="CareerVerse capabilities">
          {CV_HERO_ICONS.map((icon, i) => (
            <li
              key={icon.label}
              style={
                {
                  "--i": i,
                  "--n": CV_HERO_ICONS.length,
                  "--bg": icon.color,
                } as CSSProperties
              }
            >
              <span className="cv-hero-icon-tile">
                <Image src={icon.src} alt="" width={36} height={36} unoptimized />
              </span>
            </li>
          ))}
        </ul>
        <div className="cv-eyebrow">
          <span className="cv-eyebrow-mark">CV</span>
          CareerVerse AI 2.0 is live!
        </div>
        <h1>
          Discover <span className="cv-hero-highlight">companies hiring</span> for you
        </h1>
        <p className="cv-hero-sub">
          Browse fresher jobs and internships, match with explainable AI, and track applications—all in
          CareerVerse AI.
        </p>
        <div className="cv-hero-ctas">
          <Link href="/auth/signup" className="cv-btn-wrap">
            <span className="cv-btn">Start Free Trial</span>
          </Link>
          <Link href="/jobs" className="cv-btn-wrap is-secondary">
            <span className="cv-btn">Browse Jobs</span>
          </Link>
        </div>
      </div>

      <div className="cv-hero-stage">
        <div className="cv-hero-visual" data-hero-marquee="" ref={visualRef}>
          <div className="cv-hero-gradient" aria-hidden>
            <span className="cv-hero-beam-core" />
          </div>

          <MarqueeRow items={rowA} offset={0} curve="bowl" />
          <MarqueeRow items={rowB} offset={4} reversed curve="straight" />
          <MarqueeRow items={rowC} offset={8} curve="arch" />

          <button
            type="button"
            className="cv-hero-icon"
            data-hero-icon=""
            ref={iconRef}
            aria-label="Speed up company stream"
            onMouseEnter={onIconEnter}
            onMouseLeave={onIconLeave}
            onClick={onIconClick}
          >
            <span className="cv-hero-icon-hit" aria-hidden />
            <span className="cv-hero-icon-inner">CV</span>
          </button>

          <div className="cv-hero-fade" aria-hidden>
            <img
              className="cv-hero-wave-img"
              src={DS.heroWave}
              srcSet={`${DS.heroWave1600} 1600w, ${DS.heroWave} 1920w`}
              sizes="100vw"
              alt=""
              fetchPriority="high"
            />
            <div className="cv-hero-fade-block" />
          </div>
        </div>
      </div>
    </section>
  );
}
