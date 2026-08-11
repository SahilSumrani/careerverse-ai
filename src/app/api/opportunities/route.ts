import { jsonOk } from "@/lib/api";
import { DUMMY_JOBS } from "@/data/jobs";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";

/** Static demo opportunities while Firestore jobs collection is optional. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  let items = DUMMY_JOBS.map((j) => ({
    id: j.id,
    title: j.title,
    description: j.blurb,
    organizationName: j.company,
    location: j.location,
    type: j.type,
    workMode: j.workMode,
    skillsJson: JSON.stringify(j.tags),
    skills: j.tags.map((name) => ({ skill: { name } })),
    status: "PUBLISHED",
    isDemo: true,
    createdAt: new Date().toISOString(),
  }));

  if (q) {
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.organizationName.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q),
    );
  }

  const session = await auth();
  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
  const withMatch = ctx
    ? await Promise.all(
        items.map(async (o) => ({
          ...o,
          match: await aiService.jobMatching({
            ctx,
            opportunity: {
              title: o.title,
              description: o.description,
              skills: o.skills.map((s) => s.skill.name),
              eligibility: null,
              type: o.type,
            },
          }),
        })),
      )
    : items;

  return jsonOk({ items: withMatch, total: withMatch.length, page: 1, pageSize: withMatch.length });
}
