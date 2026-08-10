"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowUp, Plus } from "lucide-react";
import { AI_PROMPTS } from "@/data/home-content";
import { DS } from "@/data/dropship-assets";
import "./home-ai-search.css";

/**
 * Dropship `section.is-ai` + odyn `kt()`:
 * Vertical prompt list centered in the search pill; middle item is brand blue;
 * list slides up with elastic ease, then rotates first item to the end.
 * Overflow visible so neighboring prompts ghost above/below the bar.
 */
export function HomeAiSearch() {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let items = Array.from(list.children) as HTMLElement[];
    const mid = Math.floor(items.length / 2);
    let timer: number | null = null;
    let animating = false;
    let alive = true;

    const itemH = () => list.offsetHeight / items.length;

    const paint = (active: number) => {
      items.forEach((el, i) => {
        el.style.color = i === active ? "#225aea" : "";
      });
    };

    paint(mid);

    const step = () => {
      if (!alive || animating) return;
      animating = true;
      const next = mid + 1;
      paint(next);

      const start = performance.now();
      const from = 0;
      const to = -itemH();
      // Dropship: elastic.out(1, 0.85) ~1.2s — approximate with underdamped spring
      const duration = 1200;

      const elasticOut = (t: number) => {
        const amplitude = 1;
        const period = 0.85;
        if (t === 0 || t === 1) return t;
        const s = (period / (2 * Math.PI)) * Math.asin(1 / amplitude);
        return (
          amplitude *
            2 ** (-10 * t) *
            Math.sin(((t - s) * (2 * Math.PI)) / period) +
          1
        );
      };

      const tick = (now: number) => {
        if (!alive) return;
        const t = Math.min(1, (now - start) / duration);
        const y = from + (to - from) * elasticOut(t);
        list.style.transform = `translate3d(0, ${y}px, 0)`;
        if (t < 1) {
          requestAnimationFrame(tick);
          return;
        }
        // Rotate first child to end (Dropship onComplete)
        list.appendChild(list.children[0]);
        items = Array.from(list.children) as HTMLElement[];
        list.style.transform = "translate3d(0, 0, 0)";
        paint(mid);
        animating = false;
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          if (timer) {
            window.clearTimeout(timer);
            timer = null;
          }
          return;
        }
        if (timer) return;

        const schedule = (delayMs: number) => {
          timer = window.setTimeout(() => {
            if (!alive) return;
            step();
            // Dropship: next slide 2s after this one starts
            schedule(2000);
          }, delayMs);
        };
        // Dropship timeline delay: 1s before first slide
        schedule(1000);
      },
      { threshold: 0 },
    );
    io.observe(list);

    return () => {
      alive = false;
      io.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="cv-ai">
      <div className="cv-ai-bg" aria-hidden>
        <img className="cv-ai-bg-img" src={DS.aiSearchBg} alt="" loading="lazy" />
        <div className="cv-ai-bg-fade is-left" />
        <div className="cv-ai-bg-fade" />
      </div>

      <div className="cv-ai-inner">
        <h2 className="cv-ai-title">Magic AI Search</h2>
        <p className="cv-ai-sub">
          Ask for talent in plain language—CareerVerse AI shortlists candidates with explainable scores.
        </p>
        <Link href="/copilot" className="cv-btn-wrap cv-ai-link">
          <span className="cv-btn">Learn More</span>
        </Link>

        <div className="cv-ai-component">
          <div className="cv-ai-box">
            <div className="cv-ai-box-inner">
              <div className="cv-ai-icon" aria-hidden>
                <Plus className="h-4 w-4" strokeWidth={2.25} />
              </div>

              <div className="cv-ai-text-wrap">
                <div className="cv-ai-loop">
                  <div className="cv-ai-loop-viewport">
                    <ul
                      ref={listRef}
                      className="cv-ai-loop-list"
                      data-looping-words-list=""
                      aria-live="polite"
                    >
                      {AI_PROMPTS.map((prompt) => (
                        <li key={prompt} className="cv-ai-loop-item">
                          <span className="cv-ai-loop-text">{prompt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <Link href="/copilot" className="cv-ai-send" aria-label="Open Magic AI Search">
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
