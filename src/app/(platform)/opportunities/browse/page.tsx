import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Browse opportunities",
  description: "Explore jobs, internships, apprenticeships, hackathons, and more with explainable AI matching.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const where = {
    status: "PUBLISHED" as const,
    ...(sp.type ? { type: sp.type as never } : {}),
    ...(sp.q
      ? {
          OR: [
            { title: { contains: sp.q } },
            { description: { contains: sp.q } },
            { organizationName: { contains: sp.q } },
          ],
        }
      : {}),
  };
  const items = await prisma.opportunity.findMany({
    where,
    include: { skills: { include: { skill: true } } },
    orderBy: [{ deadline: "asc" }, { createdAt: "desc" }],
    take: 30,
  });
  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
  const rows = await Promise.all(
    items.map(async (item) => ({
      item,
      match: ctx
        ? await aiService.jobMatching({
            ctx,
            opportunity: {
              title: item.title,
              description: item.description,
              skills: item.skills.map((s) => s.skill.name).length
                ? item.skills.map((s) => s.skill.name)
                : parseJsonArray(item.skillsJson),
              eligibility: item.eligibility,
              type: item.type,
            },
          })
        : null,
    })),
  );

  return (
    <div>
      <PageHeader
        title="Browse opportunities"
        description="Unified jobs, internships, apprenticeships, hackathons, competitions, and scholarships. Demo listings are clearly marked."
      />
      <form className="mb-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search roles, skills, orgs"
          className="h-11 flex-1 rounded-2xl border border-border bg-card px-4 text-sm"
        />
        <select name="type" defaultValue={sp.type || ""} className="h-11 rounded-2xl border border-border bg-card px-3 text-sm">
          <option value="">All types</option>
          {["JOB", "INTERNSHIP", "APPRENTICESHIP", "HACKATHON", "COMPETITION", "SCHOLARSHIP", "EVENT"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Filter</button>
      </form>

      <div className="grid gap-3">
        {rows.map(({ item, match }) => (
          <Card key={item.id} className="p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-primary">
                  {(item.organizationName || "CV").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <Link href={`/opportunities/${item.id}`} className="text-base font-semibold hover:text-primary">
                    {item.title}
                  </Link>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.organizationName} · {item.type} · {item.workMode || "Mode n/a"} · {item.location || "Location n/a"}
                    {item.isDemo ? " · Demo data" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {match ? <Badge tone="info">{match.score}% match</Badge> : null}
                <Badge>{item.type}</Badge>
              </div>
            </div>
            {match ? (
              <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                <p>
                  <span className="font-medium text-foreground">Why:</span> {match.reasons[0]}
                </p>
                <p>
                  <span className="font-medium text-foreground">Strengths:</span> {match.strengths.slice(0, 3).join(", ")}
                </p>
                <p>
                  <span className="font-medium text-foreground">Gaps:</span> {match.gaps.slice(0, 3).join(", ") || "None flagged"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">Sign in and complete your profile for explainable match scores.</p>
            )}
          </Card>
        ))}
        {!rows.length ? (
          <EmptyState
            title="No matching opportunities yet"
            description="Try adjusting your filters or improving your profile."
          />
        ) : null}
      </div>
    </div>
  );
}
