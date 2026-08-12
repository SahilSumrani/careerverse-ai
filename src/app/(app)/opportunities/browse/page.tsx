import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";

export const metadata = {
  title: "Browse opportunities",
  description: "Explore jobs and internships with explainable AI matching.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const q = (sp.q || "").toLowerCase();
  const { jobs, source } = await loadJobsFromFirestore(40);
  const items = jobs.filter((job) => {
    if (sp.type && !job.type.toLowerCase().includes(sp.type.toLowerCase())) return false;
    if (sp.mode && !job.workMode.toLowerCase().includes(sp.mode.toLowerCase())) return false;
    if (!q) return true;
    return (
      job.title.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.blurb.toLowerCase().includes(q) ||
      job.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
  const withMatch = ctx
    ? await Promise.all(
        items.map(async (job) => ({
          job,
          match: await aiService.jobMatching({
            ctx,
            opportunity: {
              title: job.title,
              description: job.blurb,
              skills: job.tags,
              eligibility: null,
              type: job.type,
            },
          }),
        })),
      )
    : items.map((job) => ({ job, match: null }));

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Explore opportunities"
        description="Roles from your Firestore jobs feed — matched to your profile when available."
      />

      {source === "unconfigured" ? (
        <p className="mb-3 text-xs text-amber-700">
          Firebase Admin is not configured — jobs cannot load from Firestore yet.
        </p>
      ) : null}

      <form className="mb-4 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={sp.q || ""}
          placeholder="Search roles, skills, orgs"
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-border bg-card px-3 text-sm"
        />
        <select
          name="type"
          defaultValue={sp.type || ""}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All types</option>
          <option value="Full-time">Full-time</option>
          <option value="Internship">Internship</option>
          <option value="Contract">Contract</option>
        </select>
        <select
          name="mode"
          defaultValue={sp.mode || ""}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">Any mode</option>
          <option value="Remote">Remote</option>
          <option value="Hybrid">Hybrid</option>
          <option value="On-site">On-site</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      {!withMatch.length ? (
        <EmptyState
          title="No opportunities yet"
          description="Add real roles to the Firestore jobs or opportunities collection — demo listings are disabled."
        />
      ) : (
        <div className="grid gap-3">
          {withMatch.map(({ job, match }) => (
            <Link key={job.id} href={`/opportunities/${job.id}`}>
              <Card className="p-4 transition hover:border-primary/30">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{job.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {job.company} · {job.type} · {job.location}
                    </p>
                    {job.blurb ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.blurb}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.tags.slice(0, 5).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  {match ? (
                    <Badge tone={match.score >= 70 ? "accent" : match.score >= 50 ? "info" : "default"}>
                      {match.score}% match
                    </Badge>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
