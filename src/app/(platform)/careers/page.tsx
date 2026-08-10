import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Careers",
  description: "Explore career paths and open personalized roadmaps.",
};

export default async function CareersPage() {
  const careers = await prisma.career.findMany({
    include: { skills: { include: { skill: true } }, roadmaps: true },
    orderBy: { title: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Careers"
        description="Browse role paths with skill signals and jump into a personalized roadmap. Demo careers are marked."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {careers.map((career) => (
          <Card key={career.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{career.title}</CardTitle>
                {career.isDemo ? <Badge tone="warning">Demo</Badge> : null}
              </div>
              <CardDescription>{career.summary}</CardDescription>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-1">
              {career.skills.slice(0, 6).map((s) => (
                <Badge key={s.skillId}>{s.skill.name}</Badge>
              ))}
            </div>
            <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`} className="text-sm text-primary">
              Open roadmap →
            </Link>
          </Card>
        ))}
        {!careers.length ? (
          <EmptyState title="No careers yet" description="Career catalog will appear after seeding demo data." />
        ) : null}
      </div>
    </div>
  );
}
