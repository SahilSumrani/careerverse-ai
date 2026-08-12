import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { DUMMY_JOBS } from "@/data/jobs";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export const metadata = {
  title: "Browse opportunities",
  description: "Explore jobs and internships with explainable AI matching.",
};

type JobRow = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  salary?: string;
  tags: string[];
  blurb: string;
  isDemo?: boolean;
};

async function loadJobs(): Promise<{ jobs: JobRow[]; source: string }> {
  if (hasFirebaseAdminCredentials()) {
    try {
      const snap = await getAdminDb().collection("jobs").limit(40).get();
      if (!snap.empty) {
        const jobs = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || "Role"),
            company: String(data.company || data.organizationName || "Company"),
            location: String(data.location || "TBA"),
            type: String(data.type || "Full-time"),
            workMode: String(data.workMode || "Hybrid"),
            salary: data.salary ? String(data.salary) : undefined,
            tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
            blurb: String(data.blurb || data.description || ""),
            isDemo: Boolean(data.isDemo),
          };
        });
        return { jobs, source: "firestore" };
      }
      const alt = await getAdminDb().collection("opportunities").limit(40).get();
      if (!alt.empty) {
        const jobs = alt.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: String(data.title || "Role"),
            company: String(data.organizationName || data.company || "Company"),
            location: String(data.location || "TBA"),
            type: String(data.type || "Full-time"),
            workMode: String(data.workMode || "Hybrid"),
            salary: data.salary ? String(data.salary) : undefined,
            tags: Array.isArray(data.skills || data.tags) ? (data.skills || data.tags).map(String) : [],
            blurb: String(data.description || data.blurb || ""),
            isDemo: Boolean(data.isDemo),
          };
        });
        return { jobs, source: "firestore" };
      }
    } catch {
      // demo
    }
  }
  return {
    jobs: DUMMY_JOBS.map((j) => ({ ...j, isDemo: true })),
    source: "demo",
  };
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; mode?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const q = (sp.q || "").toLowerCase();
  const { jobs, source } = await loadJobs();
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
  rows.sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0));
  const strongRows = rows.filter((r) => (r.match?.score ?? 0) >= 40);
  const weakCount = rows.length - strongRows.length;
  const displayRows = strongRows.length ? strongRows : rows.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-0">
      <PageHeader
        title="Browse opportunities"
        description={
          source === "firestore"
            ? "Live listings with explainable AI matching."
            : "Demo listings with explainable AI matching."
        }
      />
      {weakCount > 0 && strongRows.length > 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          Showing stronger matches (40%+). Broaden skills or preferences to unlock more roles.
        </p>
      ) : null}
      <form className="mb-6 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Search roles, skills, orgs"
          className="h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm"
        />
        <select
          name="type"
          defaultValue={sp.type || ""}
          className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All types</option>
          {["Full-time", "Internship", "Contract"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          name="mode"
          defaultValue={sp.mode || ""}
          className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
        >
          <option value="">Any mode</option>
          {["Remote", "Hybrid", "On-site"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
      </form>

      <div className="grid gap-3 md:grid-cols-2">
        {displayRows.map(({ item, match }) => (
          <Card key={item.id} className="flex h-full flex-col overflow-hidden p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/opportunities/${item.id}`}
                  className="text-base font-semibold hover:text-primary"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.company} · {item.location} · {item.type}
                  {item.isDemo ? " · Demo" : ""}
                </p>
              </div>
              {match ? (
                <Badge
                  tone={match.score >= 70 ? "accent" : match.score >= 50 ? "info" : "default"}
                  className="shrink-0"
                >
                  {match.score}% match
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">{item.blurb}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge>{item.workMode}</Badge>
              {item.salary ? <Badge tone="accent">{item.salary}</Badge> : null}
              {item.tags.slice(0, 4).map((t) => (
                <Badge key={t} tone="default">
                  {t}
                </Badge>
              ))}
            </div>
            {match?.reasons?.length ? (
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{match.reasons[0]}</p>
            ) : null}
          </Card>
        ))}
        {!displayRows.length ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No strong matches yet"
              description="Add skills and preferences, or try a different search to see better-fit roles."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
