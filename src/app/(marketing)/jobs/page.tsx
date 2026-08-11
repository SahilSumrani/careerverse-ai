import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { DUMMY_JOBS, JOB_FILTER_CHIPS } from "@/data/jobs";
import { listingsForKind, parseFilterSlug } from "@/data/listing-filters";

export const metadata: Metadata = {
  title: "Jobs | CareerVerse AI",
  description:
    "Browse fresher and early-career jobs on CareerVerse AI—filters, stipends, and apply paths for students.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function JobsMarketingPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const initialFilters = parseFilterSlug("jobs", null, q);
  const items = listingsForKind("jobs", DUMMY_JOBS);

  return (
    <ListingsBoard
      kind="jobs"
      title="Jobs"
      subtitle="Fresher and early-career openings with clear salary bands. Sign in for explainable AI match scores."
      items={items}
      filters={JOB_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Frontend, Bangalore, React"
    />
  );
}
