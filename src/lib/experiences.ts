/** Structured work/internship experiences for onboarding + profile. */

export type ExperienceEntry = {
  company: string;
  months: number | null;
  start: string;
  end: string;
  responsibilities: string;
};

export type ExperienceFormEntry = ExperienceEntry & { id: string };

const MONTH_NAMES: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

let experienceIdCounter = 0;

export function createExperienceEntry(
  partial?: Partial<ExperienceEntry>,
): ExperienceFormEntry {
  experienceIdCounter += 1;
  return {
    id: `exp-${Date.now()}-${experienceIdCounter}`,
    company: partial?.company ?? "",
    months: partial?.months ?? null,
    start: partial?.start ?? "",
    end: partial?.end ?? "",
    responsibilities: partial?.responsibilities ?? "",
  };
}

export function toStoredExperience(entry: ExperienceEntry | ExperienceFormEntry): ExperienceEntry {
  return {
    company: entry.company.trim(),
    months: entry.months == null || Number.isNaN(entry.months) ? null : Number(entry.months),
    start: entry.start.trim(),
    end: entry.end.trim(),
    responsibilities: entry.responsibilities.trim(),
  };
}

export function sanitizeExperiences(raw: unknown): ExperienceEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: ExperienceEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const company = typeof row.company === "string" ? row.company.trim() : "";
    if (!company) continue;
    const monthsRaw = row.months;
    let months: number | null = null;
    if (typeof monthsRaw === "number" && Number.isFinite(monthsRaw) && monthsRaw >= 0) {
      months = Math.round(monthsRaw);
    } else if (typeof monthsRaw === "string" && monthsRaw.trim() && !Number.isNaN(Number(monthsRaw))) {
      months = Math.max(0, Math.round(Number(monthsRaw)));
    }
    out.push({
      company: company.slice(0, 120),
      months,
      start: typeof row.start === "string" ? row.start.trim().slice(0, 40) : "",
      end: typeof row.end === "string" ? row.end.trim().slice(0, 40) : "",
      responsibilities:
        typeof row.responsibilities === "string" ? row.responsibilities.trim().slice(0, 2000) : "",
    });
    if (out.length >= 20) break;
  }
  return out;
}

export function parseYearMonth(value: string): { y: number; m: number } | null {
  const s = value.trim();
  if (!s || /^present|current|now$/i.test(s)) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    if (y >= 1980 && y <= 2040 && m >= 1 && m <= 12) return { y, m };
  }

  const named = s.match(/^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s+(\d{4})$/i);
  if (named) {
    const m = MONTH_NAMES[named[1].toLowerCase().replace(/\.$/, "")];
    const y = Number(named[2]);
    if (m && y >= 1980 && y <= 2040) return { y, m };
  }

  const yearOnly = s.match(/^(\d{4})$/);
  if (yearOnly) {
    const y = Number(yearOnly[1]);
    if (y >= 1980 && y <= 2040) return { y, m: 1 };
  }

  return null;
}

export function toMonthInputValue(value: string): string {
  const parsed = parseYearMonth(value);
  if (!parsed) return "";
  return `${parsed.y}-${String(parsed.m).padStart(2, "0")}`;
}

export function computeMonths(start: string, end: string): number | null {
  const s = parseYearMonth(start);
  if (!s) return null;
  let e: { y: number; m: number } | null = null;
  if (!end.trim() || /^present|current|now$/i.test(end.trim())) {
    const now = new Date();
    e = { y: now.getFullYear(), m: now.getMonth() + 1 };
  } else {
    e = parseYearMonth(end);
  }
  if (!e) return null;
  const months = (e.y - s.y) * 12 + (e.m - s.m);
  if (months < 0) return null;
  return Math.max(1, months);
}

export function deriveExperienceSummary(entries: ExperienceEntry[]): string {
  const parts = entries
    .map(toStoredExperience)
    .filter((e) => e.company)
    .map((e) => {
      const period =
        e.start || e.end
          ? [e.start || "—", e.end || "—"].join(" → ")
          : "";
      const duration = e.months != null ? `${e.months} mo` : "";
      const head = [e.company, period, duration].filter(Boolean).join(" · ");
      return e.responsibilities ? `${head}\n${e.responsibilities}` : head;
    });
  return parts.join("\n\n").slice(0, 2000);
}

const MONTH_TOKEN =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE_RANGE_RE = new RegExp(
  `((?:${MONTH_TOKEN}\\.?\\s+\\d{4}|\\d{4}(?:[-/]\\d{1,2})?))\\s*(?:[–—\\-]|to)\\s*((?:${MONTH_TOKEN}\\.?\\s+\\d{4}|\\d{4}(?:[-/]\\d{1,2})?|Present|Current|Now))`,
  "i",
);

function normalizeDateToken(token: string): string {
  const t = token.trim();
  if (/^present|current|now$/i.test(t)) return "Present";
  const ym = t.match(/^(\d{4})[-/](\d{1,2})$/);
  if (ym) return `${ym[1]}-${String(Number(ym[2])).padStart(2, "0")}`;
  const named = parseYearMonth(t);
  if (named) return `${named.y}-${String(named.m).padStart(2, "0")}`;
  if (/^\d{4}$/.test(t)) return `${t}-01`;
  return t.slice(0, 40);
}

function looksLikeCompany(line: string): boolean {
  const s = line.trim();
  if (s.length < 2 || s.length > 100) return false;
  if (/^(experience|work experience|internship|employment|projects?)\b/i.test(s)) return false;
  if (/^https?:\/\//i.test(s) || /@/.test(s)) return false;
  if (/^[•\-*\d.]/.test(s)) return false;
  return true;
}

/**
 * Conservatively map an experience section into structured entries.
 * Returns [] when blocks are ambiguous — never invents companies.
 */
export function parseExperienceEntries(block: string | null | undefined): ExperienceEntry[] {
  if (!block?.trim()) return [];
  const text = block.replace(/\r/g, "").trim();
  if (text.length < 8) return [];

  const lines = text
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const entries: ExperienceEntry[] = [];
  let current: ExperienceEntry | null = null;

  const flush = () => {
    if (!current?.company) {
      current = null;
      return;
    }
    if (current.months == null && (current.start || current.end)) {
      current.months = computeMonths(current.start, current.end || "Present");
    }
    entries.push(current);
    current = null;
  };

  for (const line of lines) {
    if (/^(experience|work experience|internship|employment)\s*:?\s*$/i.test(line)) continue;

    const dateMatch = line.match(DATE_RANGE_RE);
    const dashSplit = line.split(/\s+[—–\-]\s+/);
    const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i);

    // Header: "Company — Role | Jan 2020 – Present" or "Role at Company (dates)"
    const isBullet = /^[•\-*\u2022]/.test(line) || /^\d+[.)]\s/.test(line);
    if (!isBullet && (dateMatch || dashSplit.length >= 2 || atMatch)) {
      flush();
      let company = "";
      let responsibilities = "";
      let start = "";
      let end = "";

      if (dateMatch) {
        start = normalizeDateToken(dateMatch[1]);
        end = normalizeDateToken(dateMatch[2]);
      }

      if (atMatch && looksLikeCompany(atMatch[2].replace(DATE_RANGE_RE, "").trim())) {
        company = atMatch[2].replace(DATE_RANGE_RE, "").replace(/[|()[\]]/g, " ").trim();
        responsibilities = atMatch[1].replace(DATE_RANGE_RE, "").trim();
      } else if (dashSplit.length >= 2) {
        const left = dashSplit[0].replace(DATE_RANGE_RE, "").trim();
        const right = dashSplit.slice(1).join(" — ").replace(DATE_RANGE_RE, "").trim();
        if (looksLikeCompany(left)) {
          company = left.replace(/[|()[\]]/g, " ").trim();
          responsibilities = right;
        }
      }

      if (!company) {
        const withoutDates = line.replace(DATE_RANGE_RE, "").replace(/[|()[\]]/g, " ").trim();
        if (looksLikeCompany(withoutDates) && withoutDates.split(" ").length <= 8) {
          company = withoutDates;
        }
      }

      if (company) {
        current = {
          company: company.slice(0, 120),
          months: start ? computeMonths(start, end || "Present") : null,
          start,
          end,
          responsibilities: responsibilities.slice(0, 2000),
        };
      }
      continue;
    }

    if (current) {
      const bullet = line.replace(/^[•\-*\u2022]\s*/, "").replace(/^\d+[.)]\s*/, "").trim();
      if (bullet) {
        current.responsibilities = current.responsibilities
          ? `${current.responsibilities}\n• ${bullet}`
          : `• ${bullet}`;
        current.responsibilities = current.responsibilities.slice(0, 2000);
      }
      continue;
    }

    // Lone company line followed later by bullets — start entry only if short noun phrase
    if (!isBullet && looksLikeCompany(line) && line.split(/\s+/).length <= 6 && !/\.$/.test(line)) {
      flush();
      current = {
        company: line.slice(0, 120),
        months: null,
        start: "",
        end: "",
        responsibilities: "",
      };
    }
  }

  flush();
  return entries.slice(0, 12);
}
