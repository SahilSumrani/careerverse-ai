import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { DUMMY_JOBS } from "@/data/jobs";

export const metadata = {
  title: "Browse opportunities",
  description: "Explore jobs and internships with explainable AI matching.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const q = (sp.q || "").toLowerCase();
  const items = DUMMY_JOBS.filter((job) => {
    if (sp.type && !job.type.toLowerCase().includes(sp.type.toLowerCase())) return false;
    if (!q) return true;
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.blurb.toLowerCase().includes(q) ||
      job.tags.some((t) => t.toLowerCase().includes(q))
    );
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
              description: item.blurb,
              skills: item.tags,
              eligibility: null,
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
        description="Demo job listings with explainable AI matching. Full Firestore jobs collection can be added later."
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
          {["Full-time", "Internship", "Contract"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button type="submit" className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Search
        </button>
      </form>

      <div className="grid gap-3">
        {rows.map(({ item, match }) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/opportunities/${item.id}`} className="text-base font-semibold hover:text-primary">
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.company} · {item.location} · {item.type} · Demo
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.blurb}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge>{item.workMode}</Badge>
                  {item.tags.slice(0, 3).map((t) => (
                    <Badge key={t} tone="default">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              {match ? <Badge tone="info">{match.score}% match</Badge> : null}
            </div>
          </Card>
        ))}
        {!rows.length ? (
          <EmptyState title="No opportunities matched" description="Try a different search." />
        ) : null}
      </div>
    </div>
  );
}
