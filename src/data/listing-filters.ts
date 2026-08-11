import {
  isInternshipListing,
  isWorkFromHome,
  slugifyPart,
  type DummyJob,
} from "@/data/jobs";

export type ListingKind = "internships" | "jobs";

export type ListingFilters = {
  wfh: boolean;
  partTime: boolean;
  location: string | null;
  category: string | null;
  q: string;
};

export const EMPTY_FILTERS: ListingFilters = {
  wfh: false,
  partTime: false,
  location: null,
  category: null,
  q: "",
};

export const LISTING_CITIES = [
  "Bangalore",
  "Delhi",
  "Hyderabad",
  "Mumbai",
  "Chennai",
  "Pune",
  "Kolkata",
  "Jaipur",
  "Gurgaon",
  "Noida",
] as const;

export const INTERNSHIP_PROFILES = [
  "Engineering",
  "Computer Science",
  "Design",
  "Marketing",
  "Data Science",
  "Finance",
  "MBA",
  "HR",
  "Content Writing",
  "Business Development",
] as const;

export const JOB_CATEGORIES = [
  "Engineering",
  "Design",
  "Data Science",
  "Marketing",
  "MBA",
  "Media",
  "Sales",
  "Finance",
  "HR",
  "Operations",
] as const;

const CITY_ALIASES: Record<string, string> = {
  bangalore: "Bangalore",
  bengaluru: "Bangalore",
  delhi: "Delhi",
  "delhi-ncr": "Delhi",
  hyderabad: "Hyderabad",
  mumbai: "Mumbai",
  chennai: "Chennai",
  pune: "Pune",
  kolkata: "Kolkata",
  jaipur: "Jaipur",
  gurgaon: "Gurgaon",
  gurugram: "Gurgaon",
  noida: "Noida",
};

const CATEGORY_ALIASES: Record<string, string> = {
  engineering: "Engineering",
  "computer-science": "Computer Science",
  design: "Design",
  marketing: "Marketing",
  "data-science": "Data Science",
  finance: "Finance",
  mba: "MBA",
  hr: "HR",
  "content-writing": "Content Writing",
  "business-development": "Business Development",
  media: "Media",
  sales: "Sales",
  operations: "Operations",
  "big-brands": "Engineering",
};

function categorySlug(label: string) {
  return slugifyPart(label);
}

function citySlug(label: string) {
  return slugifyPart(label);
}

/** Internshala-style path segment for list filters (single hyphenated slug). */
export function buildFilterSlug(kind: ListingKind, filters: ListingFilters): string {
  const parts: string[] = [];
  const noun = kind === "internships" ? "internship" : "jobs";

  if (filters.partTime) parts.push("part-time");
  if (filters.wfh) parts.push("work-from-home");

  if (filters.category) {
    parts.push(categorySlug(filters.category));
    if (kind === "internships") parts.push("internship");
    else parts.push("jobs");
  } else if (filters.location && !filters.wfh) {
    if (kind === "internships") parts.push("internship", "in", citySlug(filters.location));
    else parts.push("jobs", "in", citySlug(filters.location));
  }

  if (filters.category && filters.location && !filters.wfh) {
    // category already included; append -in-city
    const base = parts.join("-");
    if (!base.includes("-in-")) {
      return `${base}-in-${citySlug(filters.location)}`;
    }
  }

  if (!parts.length) return "";

  // Normalize accidental duplicate noun
  let slug = parts.join("-");
  if (kind === "jobs" && filters.category && !slug.endsWith("-jobs") && !slug.includes("-jobs-in-")) {
    slug = `${slug}-jobs`;
  }
  if (
    kind === "internships" &&
    filters.category &&
    !slug.includes("internship") &&
    !filters.location
  ) {
    slug = `${slug}-internship`;
  }

  // Rebuild cleanly for common cases
  if (filters.wfh && !filters.category && !filters.location && !filters.partTime) {
    return "work-from-home";
  }
  if (filters.wfh && filters.category && !filters.partTime) {
    return `work-from-home-${categorySlug(filters.category)}-${noun === "internship" ? "internship" : "jobs"}`;
  }
  if (filters.partTime && !filters.wfh && !filters.category && !filters.location) {
    return kind === "internships" ? "part-time-internship" : "part-time-jobs";
  }
  if (!filters.wfh && !filters.category && filters.location) {
    return kind === "internships"
      ? `internship-in-${citySlug(filters.location)}`
      : `jobs-in-${citySlug(filters.location)}`;
  }
  if (!filters.wfh && filters.category && !filters.location && !filters.partTime) {
    return kind === "internships"
      ? `${categorySlug(filters.category)}-internship`
      : `${categorySlug(filters.category)}-jobs`;
  }
  if (!filters.wfh && filters.category && filters.location) {
    return kind === "internships"
      ? `${categorySlug(filters.category)}-internship-in-${citySlug(filters.location)}`
      : `${categorySlug(filters.category)}-jobs-in-${citySlug(filters.location)}`;
  }
  if (filters.partTime && filters.wfh && !filters.category) {
    return "part-time-work-from-home";
  }
  if (filters.partTime && filters.category) {
    const head = filters.wfh ? "part-time-work-from-home" : "part-time";
    return kind === "internships"
      ? `${head}-${categorySlug(filters.category)}-internship`
      : `${head}-${categorySlug(filters.category)}-jobs`;
  }

  return slug.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function listingFilterHref(kind: ListingKind, filters: ListingFilters): string {
  const base = kind === "internships" ? "/internships" : "/jobs";
  const slug = buildFilterSlug(kind, filters);
  const path = slug ? `${base}/${slug}` : base;
  const q = filters.q.trim();
  if (!q) return path;
  return `${path}?q=${encodeURIComponent(q)}`;
}

export function parseFilterSlug(
  kind: ListingKind,
  slug: string | undefined | null,
  q?: string | string[] | undefined,
): ListingFilters {
  const filters: ListingFilters = {
    ...EMPTY_FILTERS,
    q: Array.isArray(q) ? q[0] ?? "" : q ?? "",
  };

  if (!slug) return filters;
  const raw = decodeURIComponent(slug).toLowerCase().replace(/\/+$/, "");

  if (/^jv-\d+$/i.test(raw)) {
    return filters;
  }

  if (raw.includes("work-from-home") || raw === "wfh") filters.wfh = true;
  if (raw.includes("part-time")) filters.partTime = true;

  const locMatch =
    raw.match(/internship-in-([a-z0-9-]+?)(?:-|$)/) ||
    raw.match(/jobs-in-([a-z0-9-]+?)(?:-|$)/) ||
    raw.match(/-in-([a-z0-9-]+)$/);
  if (locMatch) {
    const key = locMatch[1].replace(/-internship$|-jobs$/g, "");
    filters.location = CITY_ALIASES[key] ?? key.split("-").map(capitalize).join(" ");
  }

  // Category: strip known suffixes/prefixes
  let catProbe = raw
    .replace(/^part-time-/, "")
    .replace(/^work-from-home-/, "")
    .replace(/-work-from-home$/, "")
    .replace(/-internship-in-[a-z0-9-]+$/, "")
    .replace(/-jobs-in-[a-z0-9-]+$/, "")
    .replace(/-internship$/, "")
    .replace(/-jobs$/, "")
    .replace(/^internship-in-[a-z0-9-]+$/, "")
    .replace(/^jobs-in-[a-z0-9-]+$/, "")
    .replace(/^part-time$/, "")
    .replace(/^work-from-home$/, "");

  if (catProbe && catProbe !== raw) {
    // may still be empty after stripping location-only
  }

  if (
    catProbe &&
    !catProbe.startsWith("internship-in") &&
    !catProbe.startsWith("jobs-in") &&
    catProbe !== "part-time" &&
    catProbe !== "work-from-home"
  ) {
    const mapped = CATEGORY_ALIASES[catProbe];
    if (mapped) filters.category = mapped;
    else if (catProbe.length > 1 && !CITY_ALIASES[catProbe]) {
      // try partial alias match
      const hit = Object.entries(CATEGORY_ALIASES).find(([k]) => catProbe.includes(k));
      if (hit) filters.category = hit[1];
    }
  }

  // Location-only paths already handled; clear bogus category from location slug leftovers
  if (!filters.category) {
    for (const [alias, label] of Object.entries(CATEGORY_ALIASES)) {
      if (raw.includes(alias) && !raw.startsWith("internship-in") && !raw.startsWith("jobs-in")) {
        // Prefer explicit category tokens over city names
        if (!CITY_ALIASES[alias]) {
          filters.category = label;
          break;
        }
      }
    }
  }

  void kind;
  return filters;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function matchesCategory(job: DummyJob, category: string) {
  const hay = `${job.title} ${job.tags.join(" ")} ${job.blurb} ${job.type}`.toLowerCase();
  const tokens = category.toLowerCase().split(/\s+/);
  if (category === "Computer Science") {
    return /computer|software|full-?stack|frontend|backend|react|node|engineer|ml|python/.test(hay);
  }
  if (category === "Engineering") {
    return /engineer|engineering|frontend|backend|full-?stack|software|ml/.test(hay);
  }
  if (category === "Design") {
    return /design|ux|ui|figma|portfolio/.test(hay);
  }
  if (category === "Data Science") {
    return /data|sql|analytics|ml|python/.test(hay);
  }
  if (category === "Marketing") {
    return /marketing|content|campaign|social/.test(hay);
  }
  if (category === "HR") {
    return /\bhr\b|people ops|recruit|talent|campus/.test(hay);
  }
  if (category === "MBA" || category === "Business Development") {
    return /mba|business|campus|recruit|sales|ops/.test(hay);
  }
  if (category === "Finance") {
    return /finance|fintech|analyst/.test(hay);
  }
  if (category === "Media" || category === "Content Writing") {
    return /media|content|writing|marketing/.test(hay);
  }
  if (category === "Sales") {
    return /sales|campus|recruit|outreach/.test(hay);
  }
  if (category === "Operations") {
    return /ops|operations|people|scheduling/.test(hay);
  }
  return tokens.every((t) => hay.includes(t));
}

function matchesLocation(job: DummyJob, location: string) {
  if (isWorkFromHome(job)) return false;
  const hay = job.location.toLowerCase();
  const needle = location.toLowerCase();
  if (needle === "delhi") return /delhi|ncr/.test(hay);
  if (needle === "bangalore") return /bangalore|bengaluru/.test(hay);
  if (needle === "gurgaon") return /gurgaon|gurugram/.test(hay);
  return hay.includes(needle);
}

function isPartTimeListing(job: DummyJob) {
  const hay = `${job.type} ${job.tags.join(" ")} ${job.blurb}`.toLowerCase();
  return /part-?time|contract/.test(hay);
}

export function filterListings(items: DummyJob[], filters: ListingFilters): DummyJob[] {
  const q = filters.q.trim().toLowerCase();

  return items.filter((job) => {
    if (filters.wfh && !isWorkFromHome(job)) return false;
    if (filters.partTime && !isPartTimeListing(job)) return false;
    if (filters.location && !matchesLocation(job, filters.location)) return false;
    if (filters.category && !matchesCategory(job, filters.category)) return false;
    if (q) {
      const hay = `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.blurb}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function activeFilterCount(filters: ListingFilters) {
  let n = 0;
  if (filters.wfh) n += 1;
  if (filters.partTime) n += 1;
  if (filters.location) n += 1;
  if (filters.category) n += 1;
  if (filters.q.trim()) n += 1;
  return n;
}

export function isLegacyListingId(slug: string) {
  return /^jv-\d+$/i.test(slug);
}

export type MegaLink = { label: string; href: string };

export type MegaSection = {
  id: string;
  label: string;
  links: MegaLink[];
};

export function internshipMegaSections(): MegaSection[] {
  const kind: ListingKind = "internships";
  return [
    {
      id: "locations",
      label: "Top Locations",
      links: [
        { label: "Work from Home", href: listingFilterHref(kind, { ...EMPTY_FILTERS, wfh: true }) },
        ...LISTING_CITIES.slice(0, 8).map((city) => ({
          label: `Internship in ${city}`,
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, location: city }),
        })),
        { label: "View all internships", href: "/internships" },
      ],
    },
    {
      id: "profile",
      label: "Profile",
      links: INTERNSHIP_PROFILES.map((profile) => ({
        label: profile,
        href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: profile }),
      })),
    },
    {
      id: "categories",
      label: "Top Categories",
      links: [
        {
          label: "Engineering",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Engineering" }),
        },
        {
          label: "Marketing",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Marketing" }),
        },
        {
          label: "Design",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Design" }),
        },
        {
          label: "Data Science",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Data Science" }),
        },
        {
          label: "MBA",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "MBA" }),
        },
        {
          label: "Part-time",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, partTime: true }),
        },
      ],
    },
    {
      id: "explore",
      label: "Explore More Internships",
      links: [
        {
          label: "Work from home Engineering",
          href: listingFilterHref(kind, {
            ...EMPTY_FILTERS,
            wfh: true,
            category: "Engineering",
          }),
        },
        {
          label: "Marketing in Delhi",
          href: listingFilterHref(kind, {
            ...EMPTY_FILTERS,
            category: "Marketing",
            location: "Delhi",
          }),
        },
        {
          label: "Design in Bangalore",
          href: listingFilterHref(kind, {
            ...EMPTY_FILTERS,
            category: "Design",
            location: "Bangalore",
          }),
        },
        { label: "View all internships", href: "/internships" },
      ],
    },
    {
      id: "placement",
      label: "Placement Courses",
      links: [
        { label: "AI resume builder", href: "/resume" },
        { label: "Career roadmap", href: "/roadmap" },
        { label: "Get started", href: "/auth/signup" },
      ],
    },
  ];
}

export function jobMegaSections(): MegaSection[] {
  const kind: ListingKind = "jobs";
  return [
    {
      id: "locations",
      label: "Top Locations",
      links: [
        { label: "Work from home", href: listingFilterHref(kind, { ...EMPTY_FILTERS, wfh: true }) },
        ...LISTING_CITIES.map((city) => ({
          label: `Jobs in ${city}`,
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, location: city }),
        })),
      ],
    },
    {
      id: "categories",
      label: "Top Categories",
      links: JOB_CATEGORIES.map((category) => ({
        label: category,
        href: listingFilterHref(kind, { ...EMPTY_FILTERS, category }),
      })),
    },
    {
      id: "fresher",
      label: "Fresher Jobs",
      links: [
        { label: "All fresher jobs", href: "/jobs" },
        {
          label: "Engineering",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Engineering" }),
        },
        {
          label: "Data Science",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Data Science" }),
        },
        {
          label: "Design",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, category: "Design" }),
        },
        {
          label: "Work from home",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, wfh: true }),
        },
      ],
    },
    {
      id: "explore",
      label: "Explore More Jobs",
      links: [
        {
          label: "Jobs in Bangalore",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, location: "Bangalore" }),
        },
        {
          label: "Jobs in Delhi",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, location: "Delhi" }),
        },
        {
          label: "Part-time jobs",
          href: listingFilterHref(kind, { ...EMPTY_FILTERS, partTime: true }),
        },
        { label: "View all jobs", href: "/jobs" },
      ],
    },
    {
      id: "placement",
      label: "Placement Courses",
      links: [
        { label: "AI resume builder", href: "/resume" },
        { label: "Career roadmap", href: "/roadmap" },
        { label: "Get started", href: "/auth/signup" },
      ],
    },
  ];
}

export function listingsForKind(kind: ListingKind, all: DummyJob[]) {
  return kind === "internships"
    ? all.filter((j) => isInternshipListing(j))
    : all.filter((j) => !isInternshipListing(j));
}
