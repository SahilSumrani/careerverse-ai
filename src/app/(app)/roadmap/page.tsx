import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/states";
import { RoadmapGenerator } from "@/components/roadmap/roadmap-generator";

export const metadata = {
  title: "Career Roadmap",
  description: "Generate staged skill, learning, project, and interview roadmaps for target careers.",
};

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string }>;
}) {
  const sp = await searchParams;
  const careers = await prisma.career.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, isDemo: true },
  });

  return (
    <div>
      <PageHeader
        title="Career Roadmap"
        description="Pick a target career and generate staged guidance for skills, learning, projects, experience, and interviews."
      />
      <RoadmapGenerator careers={careers} initialTitle={sp.career} />
    </div>
  );
}
