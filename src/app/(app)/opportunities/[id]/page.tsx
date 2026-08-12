import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Briefcase, Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DUMMY_JOBS } from "@/data/jobs";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = DUMMY_JOBS.find((j) => j.id === id);
  if (!job) notFound();

  const session = await auth();
  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
  const skills = job.tags;
  const match = ctx
    ? await aiService.jobMatching({
        ctx,
        opportunity: {
          title: job.title,
          description: job.blurb,
          skills,
          eligibility: null,
          type: job.type,
        },
      })
    : null;

  const meta = [job.company, job.type, job.location, job.workMode, "Demo listing"].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Jobs
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl tracking-tight">{job.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {meta.map((part, i) => (
              <span key={`${part}-${i}`} className="inline-flex items-center gap-2">
                {i > 0 ? <span className="text-border" aria-hidden>
                  ·
                </span> : null}
                {part}
              </span>
            ))}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
              <Building2 className="h-3 w-3" aria-hidden />
              {job.company}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
              <Briefcase className="h-3 w-3" aria-hidden />
              {job.type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {job.location} · {job.workMode}
            </span>
          </div>
        </div>
        {match ? (
          <Badge tone={match.score >= 70 ? "accent" : match.score >= 50 ? "info" : "default"}>
            {match.score}% match
          </Badge>
        ) : null}
      </div>

      {match ? (
        <Card className="overflow-hidden p-5">
          <CardHeader className="mb-4 p-0">
            <CardTitle>Explainable match</CardTitle>
            <CardDescription>{match.disclaimer}</CardDescription>
          </CardHeader>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-semibold text-foreground">Why it matches</p>
              <ul className="mt-2 space-y-2 text-muted-foreground">
                {match.reasons.map((r) => (
                  <li key={r} className="leading-relaxed">
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-semibold text-foreground">Strengths</p>
              {match.strengths.length ? (
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  {match.strengths.map((r) => (
                    <li key={r} className="leading-relaxed">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">No strong skill overlap yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-muted/30 p-4">
              <p className="font-semibold text-foreground">Missing skills</p>
              {match.gaps.length ? (
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  {match.gaps.map((r) => (
                    <li key={r} className="leading-relaxed">
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground">No major skill gaps flagged for this role.</p>
              )}
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <CardHeader className="mb-3 p-0">
          <CardTitle>About the role</CardTitle>
        </CardHeader>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{job.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Compensation</dt>
            <dd className="font-medium">{job.salary}</dd>
          </div>
        </dl>
        <div className="mt-6">
          {!session?.user ? (
            <Link
              href="/auth/signin"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Sign in to track / apply
            </Link>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/applications"
                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Open application tracker
              </Link>
              <Link
                href="/jobs"
                className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-5 text-sm font-medium"
              >
                Browse more jobs
              </Link>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
