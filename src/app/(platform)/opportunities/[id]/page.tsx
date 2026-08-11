import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveOpportunityButton } from "@/components/opportunities/save-button";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.opportunity.findUnique({
    where: { id },
    include: { skills: { include: { skill: true } }, organization: true },
  });
  if (!item || item.status !== "PUBLISHED") notFound();

  const session = await auth();
  const ctx = session?.user?.id ? await getCareerContext(session.user.id) : null;
  const skills = item.skills.map((s) => s.skill.name).length
    ? item.skills.map((s) => s.skill.name)
    : parseJsonArray(item.skillsJson);
  const match = ctx
    ? await aiService.jobMatching({
        ctx,
        opportunity: {
          title: item.title,
          description: item.description,
          skills,
          eligibility: item.eligibility,
          type: item.type,
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/opportunities/browse" className="text-sm text-muted-foreground hover:text-foreground">
        ← Opportunities
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{item.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {item.organizationName} · {item.type} · {item.location} · {item.workMode}
            {item.isDemo ? " · Demo listing" : ""}
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
              <p className="mt-3 font-medium">Improve your match</p>
              <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                {match.improveActions.slice(0, 3).map((r) => (
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
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s) => (
            <Badge key={s}>{s}</Badge>
          ))}
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Eligibility</dt>
            <dd>{item.eligibility || "Not specified"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Deadline</dt>
            <dd>{item.deadline ? new Date(item.deadline).toLocaleDateString() : "Rolling / not specified"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Compensation</dt>
            <dd>{item.salaryStipend || "Not specified"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source</dt>
            <dd>{item.source || "CareerVerse"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          {session?.user ? <SaveOpportunityButton opportunityId={item.id} /> : (
            <Link href="/auth/signin" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground">
              Sign in to track / apply
            </Link>
          )}
          {item.externalUrl ? (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
            >
              External application
            </a>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
