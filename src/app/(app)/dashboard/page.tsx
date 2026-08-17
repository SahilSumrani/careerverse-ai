import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import Link from "next/link";
import { getUserById, listDirectoryUsers } from "@/lib/firestore-users";
import { EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress, Avatar } from "@/components/ui/avatar";
import { getCareerContext } from "@/lib/api";
import { aiService } from "@/lib/ai/service";
import { loadJobsFromFirestore } from "@/lib/jobs-firestore";
import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

async function countUserApplications(userId: string): Promise<number> {
  if (!hasFirebaseAdminCredentials()) return 0;
  try {
    const snap = await getAdminDb()
      .collection("applications")
      .where("userId", "==", userId)
      .limit(100)
      .get();
    return snap.docs.filter((d) => !d.id.startsWith("demo-app-") && !d.data().isDemo).length;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin?stale=1");

  const firstName = session.user.name?.split(" ")[0] || "there";
  const roles = session.user.roles ?? ["STUDENT"];
  if (roles.includes("PLATFORM_ADMIN")) redirect("/admin");
  const isHr = roles.includes("HR");

  const user = await getUserById(session.user.id).catch(() => null);
  const isMentor = roles.includes("MENTOR") || user?.registration?.track === "mentor";
  const isStudentFacing = !isHr && !isMentor;
  const people = await listDirectoryUsers(session.user.id, 4).catch(() => []);
  const analysis = user?.careerAnalysisJson ? JSON.parse(user.careerAnalysisJson) : null;
  const ctx = await getCareerContext(session.user.id).catch(() => null);
  const resume = user?.resume || user?.resumes?.[0] || null;
  const resumeScore = resume?.analyses?.[0]?.score;
  const resumeDurable =
    Boolean(resume) &&
    (resume?.storageUrl?.startsWith("gs://") ||
      (Boolean(resume?.storagePath?.startsWith("resumes/")) &&
        !resume?.storagePath?.includes("/tmp/")) ||
      (Boolean(resume?.storageUrl) && !resume?.storageUrl?.includes("/tmp/")));
  const resumeUnavailable =
    Boolean(resume) &&
    (resume?.storagePath?.includes("/tmp") || resume?.storageUrl?.includes("/tmp/"));
  const resumeStatusLabel = !resume ? "Missing" : resumeUnavailable ? "Re-upload" : resumeDurable ? "Ready" : "Pending";
  const resumeStatusHint = !resume
    ? "Upload to improve matches"
    : resumeUnavailable
      ? "Previous file unavailable — re-upload"
      : resume.fileName;

  const { jobs: liveJobs } = await loadJobsFromFirestore(12);
  const applicationsCount = isStudentFacing ? await countUserApplications(session.user.id) : 0;
  const matched = isStudentFacing
    ? (
        await Promise.all(
          liveJobs.slice(0, 8).map(async (job) => ({
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
      )
        .filter((row) => (row.match?.score ?? 0) >= 40)
        .sort((a, b) => (b.match?.score ?? 0) - (a.match?.score ?? 0))
        .slice(0, 4)
    : [];

  if (isHr) {
    let openRoles = 0;
    let applicants = 0;
    if (hasFirebaseAdminCredentials()) {
      try {
        const jobsSnap = await getAdminDb()
          .collection("jobs")
          .where("createdBy", "==", session.user.id)
          .limit(50)
          .get();
        openRoles = jobsSnap.size;
        const ids = jobsSnap.docs.map((d) => d.id);
        for (let i = 0; i < ids.length; i += 10) {
          const chunk = ids.slice(i, i + 10);
          if (!chunk.length) break;
          const apps = await getAdminDb()
            .collection("applications")
            .where("opportunityId", "in", chunk)
            .limit(100)
            .get();
          applicants += apps.size;
        }
      } catch {
        // leave zeros
      }
    }
    return (
      <div className="slide-up space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">Recruiter workspace</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight md:text-4xl">Welcome, {firstName}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {user?.recruiterApproved
              ? "Your company recruiter account is approved. Post roles and review applicants."
              : "Company registration received. Job posting unlocks after admin approval — you cannot publish until then."}
          </p>
          {!user?.recruiterApproved && user?.registration?.companyName ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Registered company: <strong className="text-foreground">{user.registration.companyName}</strong>
              {user.registration.jobTitle ? ` · ${user.registration.jobTitle}` : ""}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Open roles" value={openRoles} hint="Published by you" icon={<Briefcase className="h-4 w-4" />} />
          <StatCard label="Applicants" value={applicants} hint="On your roles" icon={<Users className="h-4 w-4" />} />
          <StatCard
            label="Status"
            value={user?.recruiterApproved ? "Approved" : "Pending"}
            hint="Admin approval"
            icon={<Calendar className="h-4 w-4" />}
            highlight
          />
        </div>
        <Card className="p-5">
          <CardHeader>
            <CardTitle>Hiring tools</CardTitle>
            <CardDescription>Publish jobs and track applications in the recruiter console.</CardDescription>
          </CardHeader>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/recruiter" className="text-sm font-semibold text-primary">
              Open recruiter console →
            </Link>
            <Link href="/opportunities/browse" className="text-sm font-semibold text-primary">
              Browse public jobs →
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
            {user?.mentorApproved
              ? "Your mentor profile is approved. Guide learners with roadmaps and feedback."
              : "Mentor registration received. Features stay limited until an admin approves your profile."}
          </p>
          {!user?.mentorApproved && user?.registration?.expertise ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Expertise submitted: <strong className="text-foreground">{user.registration.expertise}</strong>
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Mentees" value={0} hint="Assignments coming soon" icon={<Users className="h-4 w-4" />} />
          <StatCard label="Sessions" value={0} hint="No sessions scheduled" icon={<Calendar className="h-4 w-4" />} />
          <StatCard
            label="Status"
            value={user?.mentorApproved ? "Approved" : "Pending"}
            hint="Admin approval"
            icon={<Map className="h-4 w-4" />}
            highlight
          />
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
            href="/opportunities/browse"
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
          value={resumeStatusLabel}
          hint={resumeStatusHint}
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
          value={applicationsCount}
          hint={applicationsCount ? "Tracked in Applications" : "Save roles from Explore"}
          icon={<ClipboardList className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/opportunities/browse"
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
              <Link href="/opportunities/browse" className="text-sm font-medium text-primary">
                See all
              </Link>
            </div>
            <div className="grid gap-3">
              {matched.length ? (
                matched.map(({ job, match }) => (
                <Card key={job.id} className="p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <Link href="/opportunities/browse" className="font-semibold hover:text-primary">
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
                    {match ? (
                      <Badge tone={match.score >= 70 ? "accent" : match.score >= 50 ? "info" : "default"}>
                        {match.score}% match
                      </Badge>
                    ) : null}
                  </div>
                  {match ? (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {match.reasons[0]}
                      {match.gaps[0] ? <> · Build next: {match.gaps.slice(0, 2).join(", ")}</> : null}
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">{job.blurb}</p>
                  )}
                </Card>
              ))
              ) : (
                <EmptyState
                  title="No strong matches yet"
                  description="Broaden your skills or preferences to see roles with clearer fit (40%+)."
                  action={
                    <Link href="/profile" className="text-sm font-semibold text-primary">
                      Update profile →
                    </Link>
                  }
                />
              )}
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
                <Link href="/opportunities/browse" className="text-sm font-medium text-primary">
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
                {resumeDurable ? (
                  <Badge tone="info" className="mt-3">
                    File saved securely
                  </Badge>
                ) : resumeUnavailable ? (
                  <>
                    <Badge tone="warning" className="mt-3">
                      File unavailable — re-upload
                    </Badge>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Previous download link expired. Re-upload to restore preview.
                    </p>
                  </>
                ) : (
                  <Badge tone="default" className="mt-3">
                    On file
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
              {resume
                ? resume.storagePath?.includes("/tmp") || resume.storageUrl?.includes("/tmp/")
                  ? "Re-upload resume"
                  : "Manage resume"
                : "Upload resume"}
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
