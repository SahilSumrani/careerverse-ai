"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { AuthControls } from "@/components/layout/auth-controls";
import {
  internshipMegaSections,
  jobMegaSections,
  type MegaSection,
} from "@/data/listing-filters";
import "./site-header.css";

type MegaKey = "candidates" | "jobs" | "internships" | null;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState<MegaKey>(null);
  const [megaTab, setMegaTab] = useState(0);
  const [mobileAccordions, setMobileAccordions] = useState<Record<string, boolean>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaId = useId();

  useEffect(() => {
    setOpen(false);
    setMega(null);
    setMobileAccordions({});
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function openMega(key: MegaKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMega(key);
    setMegaTab(0);
  }

  function scheduleCloseMega() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(null), 160);
  }

  const internshipSections = internshipMegaSections();
  const jobSections = jobMegaSections();

  const internshipsActive =
    pathname === "/internships" ||
    pathname.startsWith("/internships/") ||
    pathname.startsWith("/internship/");
  const jobsActive =
    pathname === "/jobs" || pathname.startsWith("/jobs/") || pathname.startsWith("/job/");
  const candidatesActive = internshipsActive || jobsActive || pathname.startsWith("/events") || pathname.startsWith("/resume");

  return (
    <header className="cv-site-header sticky top-0 z-50 border-b border-[#eef2f8] bg-white text-[#0b1220]">
      <div className="cv-site-header-inner mx-auto flex h-[64px] max-w-[1180px] items-center justify-between gap-4 px-4 sm:h-[68px]">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#225aea] text-sm font-bold text-white">
            CV
          </span>
          <span className="truncate text-[16px] font-semibold tracking-tight text-[#0b1220] sm:text-[17px]">
            CareerVerse AI
          </span>
        </Link>

        <nav className="cv-site-nav hidden items-center gap-0.5 md:flex" aria-label="Primary">
          <Link href="/#for-recruiters" className="cv-nav-link">
            For recruiters
          </Link>

          <div
            className="cv-mega-wrap"
            onMouseEnter={() => openMega("candidates")}
            onMouseLeave={scheduleCloseMega}
          >
            <button
              type="button"
              className={`cv-mega-trigger${candidatesActive || mega === "candidates" ? " is-active" : ""}`}
              aria-expanded={mega === "candidates"}
              aria-controls={`${megaId}-candidates`}
              onClick={() => (mega === "candidates" ? setMega(null) : openMega("candidates"))}
            >
              For candidates
              <ChevronDown size={14} aria-hidden />
            </button>
            {mega === "candidates" ? (
              <div
                id={`${megaId}-candidates`}
                className="cv-audience-panel"
                role="menu"
                onMouseEnter={() => openMega("candidates")}
                onMouseLeave={scheduleCloseMega}
              >
                <p className="cv-audience-label">Candidate paths</p>
                <Link href="/internships" className="cv-audience-link" role="menuitem">
                  Internships
                </Link>
                <Link href="/jobs" className="cv-audience-link" role="menuitem">
                  Fresher jobs
                </Link>
                <Link href="/events" className="cv-audience-link" role="menuitem">
                  Events
                </Link>
                <Link href="/resume" className="cv-audience-link" role="menuitem">
                  Resume builder
                </Link>
                <Link href="/#for-candidates" className="cv-audience-link is-accent" role="menuitem">
                  Candidate section on homepage
                </Link>
              </div>
            ) : null}
          </div>

          <div
            className="cv-mega-wrap"
            onMouseEnter={() => openMega("internships")}
            onMouseLeave={scheduleCloseMega}
          >
            <button
              type="button"
              className={`cv-mega-trigger${internshipsActive || mega === "internships" ? " is-active" : ""}`}
              aria-expanded={mega === "internships"}
              aria-controls={`${megaId}-internships`}
              onClick={() => (mega === "internships" ? setMega(null) : openMega("internships"))}
            >
              Internships
              <ChevronDown size={14} aria-hidden />
            </button>
            {mega === "internships" ? (
              <MegaPanel
                id={`${megaId}-internships`}
                sections={internshipSections}
                activeIndex={megaTab}
                onTab={setMegaTab}
                active={internshipSections[megaTab] ?? internshipSections[0]}
                onMouseEnter={() => openMega("internships")}
                onMouseLeave={scheduleCloseMega}
              />
            ) : null}
          </div>

          <div
            className="cv-mega-wrap"
            onMouseEnter={() => openMega("jobs")}
            onMouseLeave={scheduleCloseMega}
          >
            <button
              type="button"
              className={`cv-mega-trigger${jobsActive || mega === "jobs" ? " is-active" : ""}`}
              aria-expanded={mega === "jobs"}
              aria-controls={`${megaId}-jobs`}
              onClick={() => (mega === "jobs" ? setMega(null) : openMega("jobs"))}
            >
              Jobs
              <ChevronDown size={14} aria-hidden />
            </button>
            {mega === "jobs" ? (
              <MegaPanel
                id={`${megaId}-jobs`}
                sections={jobSections}
                activeIndex={megaTab}
                onTab={setMegaTab}
                active={jobSections[megaTab] ?? jobSections[0]}
                onMouseEnter={() => openMega("jobs")}
                onMouseLeave={scheduleCloseMega}
              />
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center md:flex">
          <AuthControls />
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#e4e7ec] md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <div className="cv-mobile-nav border-t border-[#eef2f8] bg-white px-4 py-3 md:hidden">
          <Link href="/#for-recruiters" className="cv-mobile-simple">
            For recruiters
          </Link>
          <Link href="/#for-candidates" className="cv-mobile-simple">
            For candidates
          </Link>
          <MobileAccordion
            title="Internships"
            href="/internships"
            sections={internshipSections}
            open={Boolean(mobileAccordions.internships)}
            onToggle={() =>
              setMobileAccordions((s) => ({
                ...s,
                internships: !s.internships,
                jobs: false,
              }))
            }
          />
          <MobileAccordion
            title="Jobs"
            href="/jobs"
            sections={jobSections}
            open={Boolean(mobileAccordions.jobs)}
            onToggle={() =>
              setMobileAccordions((s) => ({
                ...s,
                jobs: !s.jobs,
                internships: false,
              }))
            }
          />
          <Link href="/events" className="cv-mobile-simple">
            Events
          </Link>
          <Link href="/resume" className="cv-mobile-simple">
            Resume builder
          </Link>
          <AuthControls compact />
        </div>
      ) : null}
    </header>
  );
}

function MegaPanel({
  id,
  sections,
  activeIndex,
  onTab,
  active,
  onMouseEnter,
  onMouseLeave,
}: {
  id: string;
  sections: MegaSection[];
  activeIndex: number;
  onTab: (i: number) => void;
  active: MegaSection;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      id={id}
      className="cv-mega-panel"
      role="menu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="cv-mega-cols">
        <div className="cv-mega-side" role="tablist" aria-label="Categories">
          {sections.map((section, i) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              className={`cv-mega-side-item${i === activeIndex ? " is-active" : ""}`}
              onMouseEnter={() => onTab(i)}
              onFocus={() => onTab(i)}
              onClick={() => onTab(i)}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="cv-mega-links" role="tabpanel">
          {active.links.map((link) => (
            <Link key={link.href + link.label} href={link.href} className="cv-mega-link" role="menuitem">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileAccordion({
  title,
  href,
  sections,
  open,
  onToggle,
}: {
  title: string;
  href: string;
  sections: MegaSection[];
  open: boolean;
  onToggle: () => void;
}) {
  const [tab, setTab] = useState(0);
  const section = sections[tab] ?? sections[0];

  return (
    <div className="cv-mobile-acc">
      <div className="cv-mobile-acc-row">
        <Link href={href} className="cv-mobile-acc-title">
          {title}
        </Link>
        <button
          type="button"
          className={`cv-mobile-acc-toggle${open ? " is-open" : ""}`}
          aria-expanded={open}
          aria-label={`${title} categories`}
          onClick={onToggle}
        >
          <ChevronDown size={16} />
        </button>
      </div>
      {open ? (
        <div className="cv-mobile-acc-body">
          <div className="cv-mobile-acc-tabs">
            {sections.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={`cv-mobile-acc-tab${i === tab ? " is-active" : ""}`}
                onClick={() => setTab(i)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="cv-mobile-acc-links">
            {section.links.map((link) => (
              <Link key={link.href + link.label} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
