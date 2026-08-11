"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HOME_TOOLS } from "@/data/home-content";
import { DS } from "@/data/dropship-assets";
import { CV_ICONS } from "@/data/cv-icons";
import "./home-tools.css";

export function HomeTools() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (paused.current) return;
      setActive((i) => (i + 1) % HOME_TOOLS.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, []);

  const tool = HOME_TOOLS[active];
  const iconSrc = CV_ICONS[active % CV_ICONS.length];
  const tabImg = DS.toolTabs[active % DS.toolTabs.length];

  return (
    <section className="cv-tabs">
      <div className="cv-tabs-spotlight" aria-hidden />
      <div className="cv-tabs-head">
        <h2 className="cv-section-title">CareerVerse products</h2>
        <p className="cv-section-sub">
          Every tool you need for jobs, internships, AI matching, resume review, and application tracking—in one
          CareerVerse account.
        </p>
      </div>

      <div className="cv-tabs-rail-wrap">
        <div className="cv-tabs-rail">
          {HOME_TOOLS.map((t, i) => {
            const selected = i === active;
            const src = CV_ICONS[i % CV_ICONS.length];
            return (
              <button
                key={t.id}
                type="button"
                aria-label={t.title}
                className={`cv-tab-btn${selected ? " is-active" : ""}`}
                onClick={() => {
                  paused.current = true;
                  setActive(i);
                }}
                onMouseEnter={() => {
                  paused.current = true;
                }}
                onMouseLeave={() => {
                  paused.current = false;
                }}
              >
                {selected ? <span className="cv-tab-tip">{t.title}</span> : null}
                <Image src={src} alt="" width={40} height={40} className="cv-tab-icon" unoptimized />
              </button>
            );
          })}
        </div>
      </div>

      <div className="cv-tabs-panel">
        <div className="cv-tabs-card">
          <div className="cv-tabs-main">
            <div className="cv-tabs-badge is-asset">
              <Image src={iconSrc} alt="" width={48} height={48} unoptimized />
            </div>
            <h3>{tool.title}</h3>
            <p>{tool.description}</p>
            <Link href={tool.href} className="cv-tabs-link">
              View feature <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="cv-tabs-side">
            <div className="cv-tabs-shot">
              <Image
                src={tabImg}
                alt=""
                width={640}
                height={420}
                className="cv-tabs-shot-img"
                unoptimized
                priority={active === 0}
              />
            </div>
          </div>
          <div className="cv-tabs-footer" style={{ gridColumn: "1 / -1" }}>
            {tool.points.map((p) => (
              <div key={`f-${p.title}`}>
                <strong>{p.title}</strong>
                <span>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
