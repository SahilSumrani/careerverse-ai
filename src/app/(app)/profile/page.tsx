import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJsonArray } from "@/lib/utils";
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          skills: { include: { skill: true } },
          interests: { include: { interest: true } },
        },
      },
      roles: { include: { role: true } },
      mentorProfile: true,
    },
  });

  if (!user) redirect("/auth/signin");
  const profile = user.profile;

  return (
    <div>
      <PageHeader
        title={user.name || "Your profile"}
        description={profile?.headline || user.email}
        actions={
          <div className="flex flex-wrap gap-2">
            {user.roles.map((r) => (
              <Badge key={r.roleId}>{r.role.name}</Badge>
            ))}
            {user.isDemo ? <Badge tone="warning">Demo account</Badge> : null}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Completeness</CardTitle>
            <CardDescription>Profile strength for matching and intelligence.</CardDescription>
          </CardHeader>
          <Progress value={profile?.profileCompleteness ?? 0} />
          <p className="mt-3 text-sm text-muted-foreground">{profile?.profileCompleteness ?? 0}% complete</p>
          {profile?.careerStage ? (
            <p className="mt-2 text-sm">
              Stage: <span className="font-medium">{profile.careerStage}</span>
            </p>
          ) : null}
          {profile?.workPreference ? (
            <p className="mt-1 text-sm">
              Work preference: <span className="font-medium">{profile.workPreference}</span>
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
              <dd className="font-medium">{profile?.education || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Degree</dt>
              <dd className="font-medium">{profile?.degree || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">College</dt>
              <dd className="font-medium">{profile?.college || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Graduation year</dt>
              <dd className="font-medium">{profile?.graduationYear ?? "—"}</dd>
            </div>
          </dl>
          {profile?.about || profile?.experienceSummary ? (
            <p className="mt-4 whitespace-pre-wrap text-sm text-muted-foreground">
              {profile.about || profile.experienceSummary}
            </p>
          ) : null}
          {profile?.careerGoals ? (
            <div className="mt-4">
              <p className="text-sm font-medium">Career goals</p>
              <p className="mt-1 text-sm text-muted-foreground">{profile.careerGoals}</p>
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
            {profile?.skills.length
              ? profile.skills.map((s) => <Badge key={s.skillId}>{s.skill.name}</Badge>)
              : <p className="text-sm text-muted-foreground">No skills yet — complete onboarding.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interests & preferences</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {profile?.interests.map((i) => (
              <Badge key={i.interestId} tone="success">
                {i.interest.name}
              </Badge>
            ))}
            {parseJsonArray(profile?.preferredIndustries).map((x) => (
              <Badge key={x}>{x}</Badge>
            ))}
            {parseJsonArray(profile?.preferredLocations).map((x) => (
              <Badge key={`loc-${x}`} tone="accent">
                {x}
              </Badge>
            ))}
            {!profile?.interests.length &&
            !parseJsonArray(profile?.preferredIndustries).length &&
            !parseJsonArray(profile?.preferredLocations).length ? (
              <p className="text-sm text-muted-foreground">No interests recorded yet.</p>
            ) : null}
          </div>
        </Card>
      </div>

      {(profile?.linkedinUrl || profile?.portfolioUrl || profile?.githubUrl) && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <ul className="space-y-1 text-sm">
            {profile.linkedinUrl ? (
              <li>
                <a className="text-primary" href={profile.linkedinUrl} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
            ) : null}
            {profile.portfolioUrl ? (
              <li>
                <a className="text-primary" href={profile.portfolioUrl} target="_blank" rel="noreferrer">
                  Portfolio
                </a>
              </li>
            ) : null}
            {profile.githubUrl ? (
              <li>
                <a className="text-primary" href={profile.githubUrl} target="_blank" rel="noreferrer">
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
