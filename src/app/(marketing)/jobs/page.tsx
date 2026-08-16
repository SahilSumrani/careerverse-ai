import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { JOB_FILTER_CHIPS } from "@/data/jobs";
import { listingsForKind, parseFilterSlug } from "@/data/listing-filters";
import { loadMarketingListings } from "@/lib/listings-public";

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
  const all = await loadMarketingListings();
  const items = listingsForKind("jobs", all);

  return (
    <ListingsBoard
      kind="jobs"
      title="Jobs"
      subtitle={
        items.length
          ? "Fresher and early-career openings with clear salary bands. Sign in for explainable AI match scores."
          : "No published jobs yet. Sign in to explore when recruiters post — or check back soon."
      }
      items={items}
      filters={JOB_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Frontend, Bangalore, React"
    />
  );
}
