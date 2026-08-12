"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Search, Star } from "lucide-react";
import "./home-hero.css";

const PROOF_AVATARS = ["NS", "BP", "HC", "LA", "OF"];

export function HomeHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    const qs = params.toString();
    router.push(qs ? `/jobs?${qs}` : "/jobs");
  }

  return (
    <>
      <section className="cv-hero">
        <div className="cv-hero-copy">
          <h1>
            Build your recruiting workspace with{" "}
            <span className="cv-hero-highlight">CareerVerse AI</span>
          </h1>
          <p className="cv-hero-sub">
            Score candidates, search talent in plain language, and track hiring—from fresher
            roles to full-time—in one CareerVerse account.
          </p>

          <form className="cv-hero-search" onSubmit={onSearch} role="search">
            <label className="cv-hero-search-field">
              <Search className="cv-hero-search-icon" size={18} aria-hidden />
              <input
                type="search"
                name="q"
                placeholder="Role, skill, or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search roles"
              />
            </label>
            <span className="cv-hero-search-divider" aria-hidden />
            <label className="cv-hero-search-field is-loc">
              <MapPin className="cv-hero-search-icon" size={18} aria-hidden />
              <input
                type="text"
                name="location"
                placeholder="Location or remote"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                aria-label="Location"
              />
            </label>
            <button type="submit" className="cv-hero-search-btn">
              Search
            </button>
          </form>

          <div className="cv-hero-proof">
            <div className="cv-hero-avatars" aria-hidden>
              {PROOF_AVATARS.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </div>
            <div className="cv-hero-rating">
              <Star size={14} fill="currentColor" aria-hidden />
              <Star size={14} fill="currentColor" aria-hidden />
              <Star size={14} fill="currentColor" aria-hidden />
              <Star size={14} fill="currentColor" aria-hidden />
              <Star size={14} fill="currentColor" aria-hidden />
              <span>4.8</span>
            </div>
            <p>Trusted by recruiting teams hiring students &amp; early talent</p>
          </div>

          <div className="cv-hero-ctas">
            <Link href="/auth/signup" className="cv-btn-wrap">
              <span className="cv-btn">Hire talent</span>
            </Link>
            <Link href="/#for-candidates" className="cv-btn-wrap is-secondary">
              <span className="cv-btn">Find a job</span>
            </Link>
          </div>
        </div>

        <div className="cv-hero-board" aria-hidden>
          <div className="cv-hero-board-inner">
            <article className="cv-hero-win is-profile">
              <header>
                <span className="cv-hero-win-dot" />
                <strong>Candidate</strong>
              </header>
              <div className="cv-hero-win-body">
                <div className="cv-hero-avatar">AK</div>
                <div>
                  <p className="cv-hero-win-name">Aisha Khan</p>
                  <p className="cv-hero-win-meta">React · Bangalore</p>
                </div>
                <em>94%</em>
              </div>
              <ul>
                <li>Skills match</li>
                <li>Voice score 88</li>
                <li>Ready to interview</li>
              </ul>
            </article>

            <article className="cv-hero-win is-role">
              <header>
                <span className="cv-hero-win-dot" />
                <strong>Open role</strong>
              </header>
              <div className="cv-hero-win-body is-stack">
                <p className="cv-hero-win-name">Junior Frontend Engineer</p>
                <p className="cv-hero-win-meta">Northstar Labs · Hybrid</p>
                <div className="cv-hero-tags">
                  <span>React</span>
                  <span>TypeScript</span>
                  <span>Fresher</span>
                </div>
              </div>
            </article>

            <article className="cv-hero-win is-funnel">
              <header>
                <span className="cv-hero-win-dot" />
                <strong>Hiring stages</strong>
              </header>
              <div className="cv-hero-funnel">
                <div>
                  <span>Applied</span>
                  <b>128</b>
                </div>
                <div>
                  <span>Screening</span>
                  <b>54</b>
                </div>
                <div>
                  <span>Interview</span>
                  <b>34</b>
                </div>
                <div>
                  <span>Offer</span>
                  <b>7</b>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="cv-trusted" aria-label="Trusted companies">
        <p>Trusted by teams hiring through CareerVerse</p>
        <ul>
          <li>Northstar Labs</li>
          <li>BrightPath</li>
          <li>Harbor Collective</li>
          <li>Lumen AI</li>
          <li>Orbit Finance</li>
          <li>SoftQA Studio</li>
        </ul>
      </section>
    </>
  );
}
