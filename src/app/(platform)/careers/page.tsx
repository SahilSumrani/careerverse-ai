import Link from "next/link";
import { PageHeader, EmptyState } from "@/components/ui/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CAREER_CATALOG } from "@/lib/ai/service";

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
        {CAREER_CATALOG.map((career) => (
          <Card key={career.title}>
            <CardHeader>
              <CardTitle>{career.title}</CardTitle>
              <CardDescription>
                Focus skills: {career.skills.slice(0, 4).join(", ")}
                {career.skills.length > 4 ? "…" : ""}
              </CardDescription>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-1">
              {career.skills.slice(0, 6).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <Link href={`/roadmap?career=${encodeURIComponent(career.title)}`} className="text-sm text-primary">
              Open roadmap →
            </Link>
          </Card>
        ))}
        {!CAREER_CATALOG.length ? (
          <EmptyState title="No careers yet" description="Career catalog will expand as matching improves." />
        ) : null}
      </div>
    </div>
  );
}
