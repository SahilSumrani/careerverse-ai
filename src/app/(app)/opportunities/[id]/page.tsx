import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground">
        ΓåÉ Jobs
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{job.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {job.company} ┬╖ {job.type} ┬╖ {job.location} ┬╖ {job.workMode} ┬╖ Demo listing
          </p>
        </div>
        {match ? <Badge tone="success">{match.score}% match</Badge> : null}
      </div>

      {match ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Explainable match</CardTitle>
            <CardDescription>{match.disclaimer}</CardDescription>
          </CardHeader>
          <div className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium">Why it matches</p>
              <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                {match.reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Strengths</p>
              <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                {match.strengths.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Missing skills</p>
              <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                {match.gaps.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.blurb}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Compensation</dt>
            <dd>{job.salary}</dd>
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
            <p className="text-sm text-muted-foreground">
              Application tracking on Firestore is coming next ΓÇö save this role from /jobs for now.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
