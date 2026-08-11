import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  ClipboardList,
  FileText,
  Map,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserById, listDirectoryUsers } from "@/lib/firestore-users";
import { EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, Avatar } from "@/components/ui/avatar";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { DUMMY_JOBS } from "@/data/jobs";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const firstName = session.user.name?.split(" ")[0] || "there";
  const roles = session.user.roles ?? ["STUDENT"];
  const isHr = roles.includes("HR");
  const isMentor = roles.includes("MENTOR");
  const isStudentFacing = !isHr && !isMentor;

  const user = await getUserById(session.user.id).catch(() => null);
  const people = await listDirectoryUsers(session.user.id, 4).catch(() => []);
  const analysis = user?.careerAnalysisJson ? JSON.parse(user.careerAnalysisJson) : null;
  const ctx = await getCareerContext(session.user.id).catch(() => null);
  const resume = user?.resume || user?.resumes?.[0] || null;
  const resumeScore = resume?.analyses?.[0]?.score;

  const matched = isStudentFacing
    ? await Promise.all(
        DUMMY_JOBS.slice(0, 4).map(async (job) => ({
          job,
          match: ctx
            ? await aiService.jobMatching({
                ctx,
                opportunity: {
                  title: job.title,
                  description: job.blurb,
                  skills: job.tags,
                  eligibility: null,
                  type: job.type,
                },
              })
            : null,
        })),
      )
    : [];

  if (isHr) {
    return (
      <div className="slide-up space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Recruiter workspace</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">Welcome, {firstName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Post roles, review applicants, and keep hiring pipelines organized. Student matching tools stay available for
            demos.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Open roles" value={0} hint="Opportunity posting coming soon" icon={<Briefcase className="h-4 w-4" />} />
          <StatCard label="Applicants" value={0} hint="Firestore applicant inbox" icon={<Users className="h-4 w-4" />} />
          <StatCard label="Interviews" value={0} hint="Schedule tracking" icon={<Calendar className="h-4 w-4" />} highlight />
        </div>
        <Card className="p-5">
          <CardHeader>
            <CardTitle>Hiring shell</CardTitle>
            <CardDescription>Your HR dashboard is ready—connect opportunity workflows next.</CardDescription>
          </CardHeader>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/jobs" className="text-sm font-semibold text-primary">
              Browse sample jobs →
            </Link>
            <Link href="/network" className="text-sm font-semibold text-primary">
              Find talent →
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isMentor) {
    return (
      <div className="slide-up space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Mentor workspace</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">Hi, {firstName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Guide learners with career roadmaps and feedback. Session booking lands on Firestore next.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Mentees" value={0} hint="Assignments coming soon" icon={<Users className="h-4 w-4" />} />
          <StatCard label="Sessions" value={0} hint="No sessions scheduled" icon={<Calendar className="h-4 w-4" />} />
          <StatCard label="Roadmaps shared" value={0} hint="Share from Roadmap" icon={<Map className="h-4 w-4" />} highlight />
        </div>
        <Card className="p-5">
          <CardHeader>
            <CardTitle>Mentor shell</CardTitle>
            <CardDescription>Use roadmap and network tools while mentoring features roll out.</CardDescription>
          </CardHeader>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/roadmap" className="text-sm font-semibold text-primary">
              Open roadmaps →
            </Link>
            <Link href="/mentors" className="text-sm font-semibold text-primary">
              Mentor directory →
            </Link>
          </div>
        </Card>
      </div>
    );
  }

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
            href="/jobs"
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm"
          >
            Explore jobs
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex h-11 items-center rounded-2xl border border-border bg-card px-5 text-sm font-semibold"
          >
            Career roadmap
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Profile"
          value={`${user?.profileCompleteness ?? 0}%`}
          hint={user?.onboardingComplete ? "Onboarding complete" : "Finish onboarding"}
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatCard
          label="Resume"
          value={resume ? "Ready" : "Missing"}
          hint={resume ? resume.fileName : "Upload to improve matches"}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatCard
          label="Career score"
          value={analysis?.careerScore ?? resumeScore ?? "—"}
          hint="AI-generated estimate"
          icon={<Sparkles className="h-4 w-4" />}
          highlight
        />
        <StatCard
          label="Applications"
          value={0}
          hint="Start from Jobs → tracker"
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/jobs"
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40"
        >
          Jobs & matches
        </Link>
        <Link
          href="/applications"
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40"
        >
          Applications tracker
        </Link>
        <Link
          href="/roadmap"
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold transition hover:border-primary/40"
        >
          Skill roadmap
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <Card className="p-5">
            <CardHeader className="mb-3">
              <CardTitle>Your profile</CardTitle>
              <CardDescription>
                {user?.degree || user?.education || "Student"}
                {user?.college ? ` · ${user.college}` : ""}
                {user?.graduationYear ? ` · ${user.graduationYear}` : ""}
              </CardDescription>
            </CardHeader>
            {user?.careerGoals ? (
              <p className="text-sm text-muted-foreground line-clamp-3">{user.careerGoals}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Add career goals to sharpen matches.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(user?.skills || []).slice(0, 8).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
              {!user?.skills?.length ? <Badge tone="default">No skills yet</Badge> : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href="/profile" className="font-semibold text-primary">
                View profile →
              </Link>
              <Link href="/resume" className="font-semibold text-primary">
                Resume tools →
              </Link>
              <Link href="/career" className="font-semibold text-primary">
                Career intelligence →
              </Link>
            </div>
          </Card>

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
                  description="Finish onboarding or open Career Intelligence to generate paths and skill gaps."
                  action={
                    <Link href={user?.onboardingComplete ? "/career" : "/onboarding"} className="text-sm font-medium text-primary">
                      {user?.onboardingComplete ? "Generate analysis" : "Complete onboarding"}
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
              <Link href="/jobs" className="text-sm font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="grid gap-3">
              {matched.map(({ job, match }) => (
                <Card key={job.id} className="p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <Link href="/jobs" className="font-semibold hover:text-primary">
                          {job.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {job.company} · {job.location} · {job.type}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge>{job.workMode}</Badge>
                          {job.tags.slice(0, 2).map((t) => (
                            <Badge key={t} tone="default">
                              {t}
                            </Badge>
                          ))}
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
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">{job.blurb}</p>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent applications</h2>
              <Link href="/applications" className="text-sm font-medium text-primary">
                Open tracker
              </Link>
            </div>
            <EmptyState
              title="No applications yet"
              description="Save roles from Jobs and track status in Applications when you’re ready."
              action={
                <Link href="/jobs" className="text-sm font-medium text-primary">
                  Explore jobs
                </Link>
              }
            />
          </section>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <CardHeader className="mb-2">
              <CardTitle>Resume status</CardTitle>
              <CardDescription>
                {resume ? `Uploaded ${new Date(resume.uploadedAt).toLocaleDateString()}` : "No resume on file"}
              </CardDescription>
            </CardHeader>
            {resume ? (
              <>
                <p className="text-sm font-medium truncate">{resume.fileName}</p>
                {resumeScore != null ? (
                  <p className="mt-2 text-xs text-muted-foreground">Latest analysis score: {resumeScore}</p>
                ) : null}
                {resume.storageUrl?.startsWith("gs://") || resume.storagePath?.startsWith("resumes/") ? (
                  <Badge tone="info" className="mt-3">
                    Firebase Storage
                  </Badge>
                ) : (
                  <Badge tone="default" className="mt-3">
                    Metadata in Firestore
                  </Badge>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Upload a PDF/DOCX to unlock stronger matches.</p>
            )}
            <Link
              href="/resume"
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              {resume ? "Manage resume" : "Upload resume"}
            </Link>
          </Card>

          <Card className="p-5">
            <CardHeader className="mb-2">
              <CardTitle>Profile strength</CardTitle>
              <CardDescription>Career Profile — {user?.profileCompleteness ?? 0}% complete</CardDescription>
            </CardHeader>
            <p className="font-display text-4xl tracking-tight">{user?.profileCompleteness ?? 0}%</p>
            <Progress value={user?.profileCompleteness ?? 0} className="mt-4 h-2.5" />
            <p className="mt-3 text-xs text-muted-foreground">
              Add resume, skills, and clearer goals to improve matches.
            </p>
            <Link
              href={user?.onboardingComplete ? "/profile" : "/onboarding"}
              className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl border border-border text-sm font-semibold"
            >
              {user?.onboardingComplete ? "Edit profile" : "Finish onboarding"}
            </Link>
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
                        <p className="text-[11px] text-muted-foreground">{p.headline || "Member"}</p>
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
        </aside>
      </div>
    </div>
  );
}
