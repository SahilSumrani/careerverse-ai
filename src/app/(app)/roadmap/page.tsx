import { PageHeader } from "@/components/ui/states";
import { RoadmapGenerator } from "@/components/roadmap/roadmap-generator";

export const metadata = {
  title: "Career Roadmap",
  description: "Generate staged skill, learning, project, and interview roadmaps for target careers.",
};

const STATIC_CAREERS = [
  { id: "swe", title: "Software Engineer", isDemo: true },
  { id: "pm", title: "Product Manager", isDemo: true },
  { id: "da", title: "Data Analyst", isDemo: true },
];

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
        description="Pick a target career and generate staged guidance for skills, learning, projects, experience, and interviews."
      />
      <RoadmapGenerator careers={STATIC_CAREERS} initialTitle={sp.career} />
    </div>
  );
}
