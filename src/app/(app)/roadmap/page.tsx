import { PageHeader } from "@/components/ui/states";
import { RoadmapGenerator } from "@/components/roadmap/roadmap-generator";
import { CAREER_ROADMAP_ROLES } from "@/data/career-roadmaps";

export const metadata = {
  title: "Career Roadmap",
  description: "Interactive staged skill, learning, project, and interview roadmaps for target careers.",
};

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div>
      <PageHeader
        title="Career Roadmap"
        description="Pick a role, expand stages, and check off milestones. Progress saves on this device."
      />
      <RoadmapGenerator
        careers={CAREER_ROADMAP_ROLES.map((r) => ({ id: r.id, title: r.title, isDemo: r.isDemo }))}
        initialTitle={sp.career}
      />
    </div>
  );
}
