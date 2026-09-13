import { jsonOk } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";

/** Search over Firestore jobs + user profile context. */
export async function GET(req: Request) {
  const session = await auth();
  const q = new URL(req.url).searchParams.get("q")?.toLowerCase() || "";
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

  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;

  const cacheHeader = session?.user?.id
    ? "private, no-cache, no-store"
    : "public, s-maxage=60, stale-while-revalidate=300";

  return jsonOk(
    {
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
    },
    {
      headers: {
        "Cache-Control": cacheHeader,
      },
    },
  );
}
