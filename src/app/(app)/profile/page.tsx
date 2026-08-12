import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/firestore-users";
import { formatExperienceHeadline } from "@/lib/experiences";
import { PageHeader } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Progress, Avatar } from "@/components/ui/avatar";
import { ResumeExportButtons } from "@/components/profile/resume-export-buttons";
import "@/styles/cv-product.css";

export const metadata = {
  title: "Profile",
  description: "Your CareerVerse profile and career context.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/auth/signin");

  const completeness = user.profileCompleteness ?? 0;
  const links = [
    { label: "LinkedIn", href: user.linkedinUrl },
    { label: "Portfolio", href: user.portfolioUrl },
    { label: "GitHub", href: user.githubUrl },
  ].filter((l): l is { label: string; href: string } => Boolean(l.href));

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title={user.name || "Your profile"}
        description={user.headline || user.email}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {user.roles.map((role) => (
              <Badge key={role}>{role}</Badge>
            ))}
            <ResumeExportButtons
              profile={{
                name: user.name || "CareerVerse Candidate",
                email: user.email,
                headline: user.headline,
                education: user.education,
                degree: user.degree,
                college: user.college,
                graduationYear: user.graduationYear,
                careerGoals: user.careerGoals,
                experienceSummary: user.experienceSummary,
                experiences: user.experiences,
                skills: user.skills,
                linkedinUrl: user.linkedinUrl,
                githubUrl: user.githubUrl,
                portfolioUrl: user.portfolioUrl,
              }}
            />
            <Link
              href="/onboarding"
              className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground"
            >
              Update profile
            </Link>
            <Link
              href="/resume"
              className="inline-flex h-9 items-center rounded-xl border border-border bg-card px-3 text-xs font-semibold"
            >
              Update resume
            </Link>
          </div>
        }
      />

      <div className="cv-shell">
        <div className="cv-shell-inner grid gap-4 p-4 md:p-5 lg:grid-cols-3">
          <section className="cv-panel p-5 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} className="h-12 w-12 text-sm" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Completeness
                </p>
                <p className="mt-0.5 text-lg font-semibold tracking-tight">{completeness}%</p>
              </div>
            </div>
            <Progress value={completeness} className="mt-4 h-2.5" />
            <p className="mt-2 text-sm text-muted-foreground">
              Profile strength for matching and intelligence.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              {user.careerStage ? (
                <div className="flex justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Stage</dt>
                  <dd className="font-medium">{user.careerStage}</dd>
                </div>
              ) : null}
              {user.workPreference ? (
                <div className="flex justify-between gap-3 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Work preference</dt>
                  <dd className="font-medium">{user.workPreference}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="cv-panel p-5 lg:col-span-2" style={{ animationDelay: "70ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Background
            </p>
            <h2 className="mt-1 font-display text-xl tracking-tight">Education & goals</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                { label: "Education", value: user.education || "—" },
                { label: "Degree", value: user.degree || "—" },
                { label: "College", value: user.college || "—" },
                { label: "Graduation year", value: user.graduationYear ?? "—" },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-border bg-muted/25 p-3.5">
                  <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="mt-1 font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            {user.about ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {user.about}
              </p>
            ) : null}
            {user.careerGoals ? (
              <div className="mt-4 rounded-2xl border border-border bg-accent/40 p-4">
                <p className="text-sm font-semibold">Career goals</p>
                <p className="mt-1 text-sm text-muted-foreground">{user.careerGoals}</p>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <div className="cv-stagger mt-4 space-y-4">
        {user.experiences?.length ? (
          <section className="cv-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Experience
            </p>
            <h3 className="mt-1 text-[15px] font-semibold tracking-tight">Roles on file</h3>
            <ul className="mt-4 space-y-3">
              {user.experiences.map((exp, idx) => (
                <li
                  key={`${exp.company}-${idx}`}
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-3"
                >
                  <p className="text-sm font-semibold">{formatExperienceHeadline(exp)}</p>
                  {exp.responsibilities ? (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {exp.responsibilities}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : user.experienceSummary ? (
          <section className="cv-panel p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Experience</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {user.experienceSummary}
            </p>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="cv-panel p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Skills</h3>
            <div className="cv-chip-row mt-3">
              {user.skills.length
                ? user.skills.map((s) => <Badge key={s}>{s}</Badge>)
                : (
                    <p className="text-sm text-muted-foreground">No skills yet — complete onboarding.</p>
                  )}
            </div>
          </section>
          <section className="cv-panel p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Interests & preferences</h3>
            <div className="cv-chip-row mt-3">
              {user.interests.map((i) => (
                <Badge key={i} tone="success">
                  {i}
                </Badge>
              ))}
              {user.preferredIndustries.map((x) => (
                <Badge key={x}>{x}</Badge>
              ))}
              {user.preferredLocations.map((x) => (
                <Badge key={`loc-${x}`} tone="accent">
                  {x}
                </Badge>
              ))}
              {!user.interests.length &&
              !user.preferredIndustries.length &&
              !user.preferredLocations.length ? (
                <p className="text-sm text-muted-foreground">No interests recorded yet.</p>
              ) : null}
            </div>
          </section>
        </div>

        {links.length ? (
          <section className="cv-panel p-5">
            <h3 className="text-[15px] font-semibold tracking-tight">Links</h3>
            <ul className="mt-3 space-y-2">
              {links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="cv-link-row text-sm font-medium text-foreground"
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  );
}
