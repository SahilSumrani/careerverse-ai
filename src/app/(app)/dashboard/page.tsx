import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  ClipboardList,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, Avatar } from "@/components/ui/avatar";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { parseJsonArray } from "@/lib/utils";

function statusTone(status: string): "success" | "info" | "violet" | "warning" | "default" {
  if (status === "APPLIED" || status === "OFFER") return status === "OFFER" ? "warning" : "success";
  if (status === "INTERVIEW") return "info";
  if (status === "ASSESSMENT" || status === "PREPARING") return "violet";
  return "default";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";

  const [profile, applications, events, notifications, appCounts] = await Promise.all([
    prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: { skills: { include: { skill: true } }, interests: { include: { interest: true } } },
    }),
    prisma.application.findMany({
      where: { userId: session.user.id },
      include: { opportunity: true },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "LIVE"] }, date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: { _all: true },
    }),
  ]);

  const countBy = Object.fromEntries(appCounts.map((c) => [c.status, c._count._all]));
  const analysis = profile?.careerAnalysisJson ? JSON.parse(profile.careerAnalysisJson) : null;
  const ctx = await getCareerContext(session.user.id);
  const opps = await prisma.opportunity.findMany({
    where: { status: "PUBLISHED" },
    include: { skills: { include: { skill: true } } },
    take: 4,
    orderBy: { createdAt: "desc" },
  });
  const matched = ctx
    ? await Promise.all(
        opps.map(async (o) => ({
          o,
          match: await aiService.jobMatching({
            ctx,
            opportunity: {
              title: o.title,
              description: o.description,
              skills: o.skills.map((s) => s.skill.name).length
                ? o.skills.map((s) => s.skill.name)
                : parseJsonArray(o.skillsJson),
              eligibility: o.eligibility,
              type: o.type,
            },
          }),
        })),
      )
    : opps.map((o) => ({ o, match: null }));

  const people = await prisma.user.findMany({
    where: { id: { not: session.user.id }, profile: { isNot: null }, suspendedAt: null },
    include: { profile: true },
    take: 4,
  });

  return (
    <div className="slide-up space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Career operating system</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">Good day, {firstName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Track progress, review matches, and take the next best career action—without the noise.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/opportunities"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            Explore opportunities
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/career"
            className="inline-flex h-11 items-center rounded-2xl border border-border bg-card px-5 text-sm font-semibold"
          >
            Open intelligence
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Applications"
          value={applications.length ? Object.values(countBy).reduce((a, b) => a + b, 0) : 0}
          hint="Tracked in CareerVerse"
          icon={<ClipboardList className="h-4 w-4" />}
        />
        <StatCard
          label="Interviews"
          value={countBy.INTERVIEW || 0}
          hint="Active interview stage"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Career score"
          value={analysis?.careerScore ?? "—"}
          hint="AI-generated estimate"
          icon={<Sparkles className="h-4 w-4" />}
          highlight
        />
        <StatCard
          label="Upcoming events"
          value={events.length}
          hint="Next sessions on your radar"
          icon={<Calendar className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="hero-soft border-b border-border px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">AI Career Intelligence</p>
                  <p className="mt-1 text-xs text-muted-foreground">Explainable fit—not guaranteed outcomes.</p>
                </div>
                <Badge tone="accent">AI-generated estimate</Badge>
              </div>
              {analysis ? (
                <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr]">
                  <div className="rounded-2xl bg-card p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="mt-1 font-display text-4xl">{analysis.careerScore}</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {(analysis.suitablePaths || []).slice(0, 3).map((p: { title: string; score: number }) => (
                      <div key={p.title} className="rounded-2xl bg-card/90 p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="truncate font-medium">{p.title}</span>
                          <span className="text-primary">{p.score}%</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${p.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState
                  className="mt-4 border-0 bg-card/80"
                  title="No career analysis yet"
                  description="Generate intelligence to see matches and skill gaps."
                  action={
                    <Link href="/career" className="text-sm font-medium text-primary">
                      Generate analysis
                    </Link>
                  }
                />
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-4 md:px-6">
              <p className="text-sm text-muted-foreground">Why it matches · What you have · What’s missing</p>
              <Link href="/career" className="text-sm font-semibold text-primary">
                View details →
              </Link>
            </div>
          </Card>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Opportunities for you</h2>
              <Link href="/opportunities" className="text-sm font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="grid gap-3">
              {matched.map(({ o, match }) => (
                <Card key={o.id} className="p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <Link href={`/opportunities/${o.id}`} className="font-semibold hover:text-primary">
                          {o.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {o.organizationName || "Organization"} · {o.location || "Location n/a"} · {o.type}
                          {o.isDemo ? " · Demo" : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{o.workMode || "Flexible"}</Badge>
                          {o.deadline ? <Badge tone="default">Due {new Date(o.deadline).toLocaleDateString()}</Badge> : null}
                        </div>
                      </div>
                    </div>
                    {match ? <Badge tone="info">{match.score}% match</Badge> : null}
                  </div>
                  {match ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Why:</span> {match.reasons[0]}
                      {match.gaps[0] ? (
                        <>
                          {" "}
                          · <span className="font-medium text-foreground">Gap:</span> {match.gaps.slice(0, 2).join(", ")}
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </Card>
              ))}
              {!matched.length ? (
                <EmptyState
                  title="No matching opportunities yet"
                  description="Try adjusting filters or improving your profile."
                  action={
                    <Link href="/opportunities" className="text-sm font-medium text-primary">
                      Explore Opportunities
                    </Link>
                  }
                />
              ) : null}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent applications</h2>
              <Link href="/applications" className="text-sm font-medium text-primary">
                Open tracker
              </Link>
            </div>
            {applications.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {applications.map((a) => (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{a.opportunity.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.opportunity.organizationName || "Organization"}
                          {a.opportunity.isDemo ? " · Demo" : ""}
                        </p>
                      </div>
                      <Badge tone={statusTone(a.status)}>{a.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge>{a.opportunity.type}</Badge>
                      {a.matchScore != null ? <Badge tone="accent">{a.matchScore}% match</Badge> : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No applications"
                description="Start tracking your career opportunities."
                action={
                  <Link href="/opportunities" className="text-sm font-medium text-primary">
                    Explore Opportunities
                  </Link>
                }
              />
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <CardHeader className="mb-2">
              <CardTitle>Profile strength</CardTitle>
              <CardDescription>Career Profile — {profile?.profileCompleteness ?? 0}% complete</CardDescription>
            </CardHeader>
            <p className="font-display text-4xl tracking-tight">{profile?.profileCompleteness ?? 0}%</p>
            <Progress value={profile?.profileCompleteness ?? 0} className="mt-4 h-2.5" />
            <p className="mt-3 text-xs text-muted-foreground">
              Add resume, skills, and clearer goals to improve matches.
            </p>
            <Link
              href="/profile"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Edit profile
            </Link>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming events</CardTitle>
            </CardHeader>
            {events.length ? (
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="rounded-2xl bg-muted/70 p-3">
                    <Link href={`/events/${e.id}`} className="text-sm font-semibold hover:text-primary">
                      {e.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(e.date).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming events published yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>People to connect</CardTitle>
              <CardDescription>Aligned with your career direction.</CardDescription>
            </CardHeader>
            {people.length ? (
              <ul className="space-y-3">
                {people.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={p.name} className="h-9 w-9" />
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-[11px] text-muted-foreground">{p.profile?.headline || "Member"}</p>
                      </div>
                    </div>
                    <Link href="/network" className="text-xs font-semibold text-primary">
                      Connect
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No connections yet"
                description="Discover people aligned with your goals."
                action={
                  <Link href="/network" className="text-sm font-medium text-primary">
                    Find People
                  </Link>
                }
              />
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            {notifications.length ? (
              <ul className="space-y-3 text-sm">
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-2xl border border-border/80 px-3 py-2">
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">You’re all caught up.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
