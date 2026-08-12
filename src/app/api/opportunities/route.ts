import { jsonOk } from "@/lib/api";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();
  const { jobs, source } = await loadJobsFromFirestore(50);

  let items = jobs.map((j) => ({
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
    isDemo: false,
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

  return jsonOk({
    items: withMatch,
    total: withMatch.length,
    page: 1,
    pageSize: withMatch.length,
    source,
  });
}
