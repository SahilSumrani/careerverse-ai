"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  MapPin,
  IndianRupee,
  Building2,
  Clock3,
  Home,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { listingHref, isWorkFromHome, type DummyJob } from "@/data/jobs";
import {
  type ListingFilters,
  type ListingKind,
  EMPTY_FILTERS,
  LISTING_CITIES,
  activeFilterCount,
  filterListings,
  listingFilterHref,
} from "@/data/listing-filters";
import "./listings-board.css";

type Props = {
  kind: ListingKind;
  title: string;
  subtitle: string;
  items: DummyJob[];
  filters: readonly string[];
  initialFilters: ListingFilters;
  searchPlaceholder?: string;
};

function FiltersBody({
  idPrefix,
  draft,
  filterCount,
  categoryChips,
  onClearAll,
  onToggleWfh,
  onTogglePartTime,
  onSetCategory,
  onSetLocation,
}: {
  idPrefix: string;
  draft: ListingFilters;
  filterCount: number;
  categoryChips: readonly string[];
  onClearAll: () => void;
  onToggleWfh: () => void;
  onTogglePartTime: () => void;
  onSetCategory: (category: string | null) => void;
  onSetLocation: (location: string | null) => void;
}) {
  return (
    <>
      <div className="cv-board-filter-actions">
        <h2>Filters</h2>
        {filterCount > 0 ? (
          <button type="button" className="cv-board-clear" onClick={onClearAll}>
            Clear all
          </button>
        ) : null}
      </div>

      <label className="cv-board-check">
        <input id={`${idPrefix}-wfh`} type="checkbox" checked={draft.wfh} onChange={onToggleWfh} />
        Work from home
      </label>
      <label className="cv-board-check">
        <input
          id={`${idPrefix}-pt`}
          type="checkbox"
          checked={draft.partTime}
          onChange={onTogglePartTime}
        />
        Part-time
      </label>

      <div className="cv-board-filter-group">
        <p>Popular categories</p>
        <div className="cv-board-chips">
          {categoryChips.map((chip) => {
            const normalized = chip === "Big brands" ? "Engineering" : chip;
            const selected = draft.category === normalized;
            return (
              <button
                key={chip}
                type="button"
                className={`cv-board-chip${selected ? " is-active" : ""}`}
                onClick={() => onSetCategory(chip)}
                aria-pressed={selected}
              >
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      <div className="cv-board-filter-group">
        <p>Location</p>
        <div className="cv-board-chips">
          {LISTING_CITIES.slice(0, 8).map((city) => {
            const selected = draft.location === city;
            return (
              <button
                key={city}
                type="button"
                className={`cv-board-chip${selected ? " is-active" : ""}`}
                onClick={() => onSetLocation(city)}
                aria-pressed={selected}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      <div className="cv-board-filter-group">
        <p>Quick links</p>
        <ul className="cv-board-links">
          <li>
            <Link href="/internships">Internships</Link>
          </li>
          <li>
            <Link href="/jobs">Fresher jobs</Link>
          </li>
          <li>
            <Link href="/auth/signup">Get started</Link>
          </li>
        </ul>
      </div>
    </>
  );
}

export function ListingsBoard({
  kind,
  title,
  subtitle,
  items,
  filters,
  initialFilters,
  searchPlaceholder = "e.g. Design, Mumbai, React",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<ListingFilters>(initialFilters);
  const [search, setSearch] = useState(initialFilters.q);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDraft(initialFilters);
    setSearch(initialFilters.q);
  }, [initialFilters]);

  const filtered = useMemo(() => filterListings(items, draft), [items, draft]);
  const countLabel = kind === "internships" ? "internships" : "jobs";
  const filterCount = activeFilterCount(draft);
  const categoryChips = filters.filter((c) => c !== "Work from home" && c !== "Part-time");

  function navigate(next: ListingFilters) {
    setDraft(next);
    startTransition(() => {
      router.push(listingFilterHref(kind, next));
    });
  }

  function toggleWfh() {
    navigate({ ...draft, wfh: !draft.wfh, location: !draft.wfh ? null : draft.location });
  }

  function togglePartTime() {
    navigate({ ...draft, partTime: !draft.partTime });
  }

    function setCategory(category: string | null) {
    const normalized =
      category === "Big brands" ? "Engineering" : category;
    navigate({
      ...draft,
      category: draft.category === normalized ? null : normalized,
    });
  }

  function setLocation(location: string | null) {
    navigate({
      ...draft,
      location: draft.location === location ? null : location,
      wfh: location ? false : draft.wfh,
    });
  }

  function clearAll() {
    setSearch("");
    navigate({ ...EMPTY_FILTERS });
    setDrawerOpen(false);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate({ ...draft, q: search.trim() });
  }

  const filtersBody = (idPrefix: string) => (
    <FiltersBody
      idPrefix={idPrefix}
      draft={draft}
      filterCount={filterCount}
      categoryChips={categoryChips}
      onClearAll={clearAll}
      onToggleWfh={toggleWfh}
      onTogglePartTime={togglePartTime}
      onSetCategory={setCategory}
      onSetLocation={setLocation}
    />
  );

  return (
    <div className={`cv-board${pending ? " is-pending" : ""}`}>
      <header className="cv-board-hero">
        <div className="cv-board-hero-inner">
          <p className="cv-board-kicker">CareerVerse AI</p>
          <h1>{title}</h1>
          <p className="cv-board-sub">{subtitle}</p>
          <form className="cv-board-search" onSubmit={submitSearch}>
            <input
              name="q"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search listings"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </header>

      <div className="cv-board-mobile-bar">
        <button
          type="button"
          className="cv-board-mobile-filters"
          onClick={() => setDrawerOpen(true)}
        >
          <SlidersHorizontal size={16} aria-hidden />
          Filters{filterCount > 0 ? ` (${filterCount})` : ""}
        </button>
        {filterCount > 0 ? (
          <button type="button" className="cv-board-clear" onClick={clearAll}>
            Clear
          </button>
        ) : null}
      </div>

      <div className="cv-board-body">
        <aside className="cv-board-filters cv-board-filters-desktop" aria-label="Filters">
          {filtersBody("desk")}
        </aside>

        <section className="cv-board-list" aria-label={`${countLabel} list`}>
          <div className="cv-board-list-head">
            <h2>
              {filtered.length} {countLabel} available
            </h2>
            <p>
              {filterCount > 0
                ? "Showing filtered sample listings — sign in for explainable match scores."
                : "Sample listings — sign in for explainable match scores."}
            </p>
          </div>

          <div className="cv-board-cards">
            {filtered.length === 0 ? (
              <div className="cv-board-empty">
                <p>No {countLabel} match these filters.</p>
                <button type="button" className="cv-board-clear" onClick={clearAll}>
                  Clear all filters
                </button>
              </div>
            ) : (
              filtered.map((job) => <ListingCard key={job.id} job={job} kind={kind} />)
            )}
          </div>
        </section>
      </div>

      {drawerOpen ? (
        <div className="cv-board-drawer" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="cv-board-drawer-backdrop"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="cv-board-drawer-panel">
            <div className="cv-board-drawer-head">
              <h2>Filters</h2>
              <button
                type="button"
                className="cv-board-drawer-close"
                aria-label="Close"
                onClick={() => setDrawerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="cv-board-drawer-body">{filtersBody("mob")}</div>
            <div className="cv-board-drawer-foot">
              <button type="button" className="cv-board-clear" onClick={clearAll}>
                Clear all
              </button>
              <button
                type="button"
                className="cv-board-apply-filters"
                onClick={() => setDrawerOpen(false)}
              >
                Show {filtered.length} {countLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ListingCard({ job, kind }: { job: DummyJob; kind: ListingKind }) {
  const wfh = isWorkFromHome(job);
  const locationLabel = wfh ? "Work from home" : job.location;

  return (
    <article className="cv-board-card">
      <div className="cv-board-card-main">
        <div className="cv-board-card-top">
          {job.activelyHiring !== false ? (
            <span className="cv-board-hiring">
              <span aria-hidden />
              Actively hiring
            </span>
          ) : null}
          <span className={`cv-board-type ${kind === "internships" ? "is-intern" : ""}`}>
            {job.type}
          </span>
          {wfh ? <span className="cv-board-mode is-wfh">WFH</span> : null}
        </div>
        <h3>
          <Link href={listingHref(job)}>{job.title}</Link>
        </h3>
        <p className="cv-board-company">
          <Building2 size={14} aria-hidden />
          {job.company}
        </p>
        <ul className="cv-board-meta">
          <li>
            {wfh ? <Home size={14} aria-hidden /> : <MapPin size={14} aria-hidden />}
            {locationLabel}
            {!wfh && job.workMode === "Hybrid" ? " (Hybrid)" : ""}
          </li>
          <li>
            <IndianRupee size={14} aria-hidden />
            {job.salary}
          </li>
          <li>
            <Clock3 size={14} aria-hidden />
            {job.duration || (kind === "internships" ? "3 Months" : job.workMode)}
          </li>
        </ul>
        <p className="cv-board-blurb">{job.blurb}</p>
        <div className="cv-board-tags">
          {job.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
      <div className="cv-board-card-actions">
        <Link href="/auth/signup" className="cv-board-apply">
          Apply now
        </Link>
        <Link href={listingHref(job)} className="cv-board-view">
          View details
        </Link>
      </div>
    </article>
  );
}
