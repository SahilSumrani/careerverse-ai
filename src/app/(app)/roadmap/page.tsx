import { PageHeader } from "@/components/ui/states";
import { RoadmapGenerator } from "@/components/roadmap/roadmap-generator";

export const metadata = {
  title: "Career Roadmap",
  description: "AI-personalized staged skill, learning, project, and interview roadmaps for target careers.",
};

export default async function RoadmapPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <PageHeader
        title="Career Roadmap"
        description="Pick a role, generate a personalized plan from your profile, and check off milestones. Progress saves on this device."
      />
      <RoadmapGenerator initialTitle={sp.career} />
    </div>
  );
}
