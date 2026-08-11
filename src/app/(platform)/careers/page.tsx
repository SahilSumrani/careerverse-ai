import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATIC_CAREERS = [
  {
    id: "swe",
    title: "Software Engineer",
    summary: "Build products with strong fundamentals in code, systems, and collaboration.",
    skills: ["JavaScript", "TypeScript", "React", "APIs"],
  },
  {
    id: "pm",
    title: "Product Manager",
    summary: "Ship outcomes by aligning users, metrics, and engineering.",
    skills: ["Product", "Analytics", "Communication", "Roadmapping"],
  },
  {
    id: "da",
    title: "Data Analyst",
    summary: "Turn messy data into decisions with SQL, viz, and storytelling.",
    skills: ["SQL", "Python", "Dashboards", "Statistics"],
  },
];

export const metadata = {
  title: "Careers",
  description: "Explore career paths and open personalized roadmaps.",
};

export default async function CareersPage() {
  return (
    <div>
      <PageHeader
        title="Careers"
        description="Browse role paths with skill signals and jump into a personalized roadmap."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {STATIC_CAREERS.map((career) => (
          <Card key={career.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{career.title}</CardTitle>
                <Badge tone="warning">Demo</Badge>
              </div>
              <CardDescription>{career.summary}</CardDescription>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-1">
              {career.skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`} className="text-sm text-primary">
              Open roadmap →
            </Link>
          </Card>
        ))}
        {!STATIC_CAREERS.length ? (
          <EmptyState title="No careers yet" description="Career catalog will expand on Firestore." />
        ) : null}
      </div>
    </div>
  );
}
