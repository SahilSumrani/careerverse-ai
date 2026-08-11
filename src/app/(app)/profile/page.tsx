import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/firestore-users";
import { PageHeader } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/avatar";

export const metadata = {
  title: "Profile",
  description: "Your CareerVerse profile and career context.",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const user = await getUserById(session.user.id);
  if (!user) redirect("/auth/signin");

  return (
    <div>
      <PageHeader
        title={user.name || "Your profile"}
        description={user.headline || user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <Badge key={role}>{role}</Badge>
            ))}
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Completeness</CardTitle>
            <CardDescription>Profile strength for matching and intelligence.</CardDescription>
          </CardHeader>
          <Progress value={user.profileCompleteness ?? 0} />
          <p className="mt-3 text-sm text-muted-foreground">{user.profileCompleteness ?? 0}% complete</p>
          {user.careerStage ? (
            <p className="mt-2 text-sm">
              Stage: <span className="font-medium">{user.careerStage}</span>
            </p>
          ) : null}
          {user.workPreference ? (
            <p className="mt-1 text-sm">
              Work preference: <span className="font-medium">{user.workPreference}</span>
            </p>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Background</CardTitle>
          </CardHeader>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Education</dt>
              <dd className="font-medium">{user.education || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Degree</dt>
              <dd className="font-medium">{user.degree || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">College</dt>
              <dd className="font-medium">{user.college || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Graduation year</dt>
              <dd className="font-medium">{user.graduationYear ?? "—"}</dd>
            </div>
          </dl>
          {user.about || user.experienceSummary ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {user.about || user.experienceSummary}
            </p>
          ) : null}
          {user.careerGoals ? (
            <div className="mt-4">
              <p className="text-sm font-medium">Career goals</p>
              <p className="mt-1 text-sm text-muted-foreground">{user.careerGoals}</p>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {user.skills.length
              ? user.skills.map((s) => <Badge key={s}>{s}</Badge>)
              : <p className="text-sm text-muted-foreground">No skills yet — complete onboarding.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interests & preferences</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
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
        </Card>
      </div>

      {(user.linkedinUrl || user.portfolioUrl || user.githubUrl) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <ul className="space-y-1 text-sm">
            {user.linkedinUrl ? (
              <li>
                <a className="text-primary" href={user.linkedinUrl} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {user.portfolioUrl ? (
              <li>
                <a className="text-primary" href={user.portfolioUrl} target="_blank" rel="noreferrer">
                  Portfolio
                </a>
              </li>
            ) : null}
            {user.githubUrl ? (
              <li>
                <a className="text-primary" href={user.githubUrl} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
            ) : null}
          </ul>
        </Card>
      )}
    </div>
  );
}
