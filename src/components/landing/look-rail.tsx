"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  children: ReactNode;
  label: string;
};

export function LookRail({ children, label }: Props) {
  const railRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 2) {
      setProgress(1);
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const ratio = el.scrollLeft / max;
    setProgress(Math.min(1, Math.max(0, ratio)));
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sync, children]);

  const scrollByCards = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(".cv-look-card");
    const step = card ? card.offsetWidth + 16 : Math.max(240, el.clientWidth * 0.75);
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div className="cv-look-rail-wrap">
      <div ref={railRef} className="cv-look-rail" role="list" aria-label={label}>
        {children}
      </div>
      <div className="cv-look-rail-nav" aria-hidden={!(canPrev || canNext)}>
        <button
          type="button"
          className="cv-look-rail-arrow"
          aria-label={`Previous ${label}`}
          disabled={!canPrev}
          onClick={() => scrollByCards(-1)}
        >
          <ChevronLeft size={18} strokeWidth={2.25} />
        </button>
        <div className="cv-look-rail-track" aria-hidden>
          <span className="cv-look-rail-fill" style={{ width: `${Math.max(12, progress * 100)}%` }} />
        </div>
        <button
          type="button"
          className="cv-look-rail-arrow"
          aria-label={`Next ${label}`}
          disabled={!canNext}
          onClick={() => scrollByCards(1)}
        >
          <ChevronRight size={18} strokeWidth={2.25} />
        </button>
      </div>
    </div>
  );
}
