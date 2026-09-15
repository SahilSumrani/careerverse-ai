import { jsonOk } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";

export const dynamic = "force-dynamic";

type SearchResultPayload = {
  opportunities: Array<{ id: string; title: string; organizationName: string; type: string }>;
  people: unknown[];
  events: unknown[];
  careers: unknown[];
  posts: unknown[];
  profileHint: unknown;
};

// In-memory TTL cache for frequent query strings
const searchCache = new Map<string, { payload: SearchResultPayload; timestamp: number }>();
const SEARCH_CACHE_TTL_MS = 60_000; // 60 seconds
const MAX_CACHE_ENTRIES = 200;

function pruneCache() {
  if (searchCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
}

/** Search over Firestore jobs + user profile context with edge & in-memory caching. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").slice(0, 100).toLowerCase().trim();

    // Fast check: Only check session if an auth cookie is present
    const cookieHeader = req.headers.get("cookie") || "";
    const hasAuthCookie = cookieHeader.includes("authjs") || cookieHeader.includes("next-auth");

    const session = hasAuthCookie ? await auth() : null;
    const isPersonalized = Boolean(session?.user?.id);

    // Return from in-memory cache if public query exists and is fresh
    const now = Date.now();
    if (!isPersonalized && searchCache.has(q)) {
      const cached = searchCache.get(q)!;
      if (now - cached.timestamp < SEARCH_CACHE_TTL_MS) {
        return jsonOk(cached.payload, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
          },
        });
      }
      searchCache.delete(q);
    }

    const { jobs } = await loadJobsFromFirestore(40);
    const filtered = jobs
      .filter(
        (j) =>
          !q ||
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)),
      )
      .slice(0, 8);

    const ctx = isPersonalized ? await getCareerContext(session!.user!.id) : null;

    const payload: SearchResultPayload = {
      opportunities: filtered.map((j) => ({
        id: j.id,
        title: j.title,
        organizationName: j.company,
        type: j.type,
      })),
      people: [],
      events: [],
      careers: [],
      posts: [],
      profileHint: ctx?.careerGoals ?? null,
    };

    if (!isPersonalized) {
      pruneCache();
      searchCache.set(q, { payload, timestamp: now });
    }

    const cacheHeader = isPersonalized
      ? "private, no-cache, no-store"
      : "public, s-maxage=60, stale-while-revalidate=300";

    return jsonOk(payload, {
      headers: {
        "Cache-Control": cacheHeader,
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return jsonOk({
      opportunities: [],
      people: [],
      events: [],
      careers: [],
      posts: [],
      profileHint: null,
    });
  }
}
