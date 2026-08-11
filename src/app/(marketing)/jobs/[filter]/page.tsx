import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingsBoard } from "@/components/landing/listings-board";
import {
  DUMMY_JOBS,
  JOB_FILTER_CHIPS,
  getJobById,
  isInternshipListing,
  listingHref,
} from "@/data/jobs";
import {
  isLegacyListingId,
  listingsForKind,
  parseFilterSlug,
} from "@/data/listing-filters";

type Props = {
  params: Promise<{ filter: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { filter } = await params;
  const label = filter.replace(/-/g, " ");
  return {
    title: `${label} | Jobs | CareerVerse AI`,
    description: `Filtered fresher jobs on CareerVerse AI for ${label}.`,
  };
}

/** Internshala-style `/jobs/{filter-slug}` (+ legacy `/jobs/jv-*` redirect). */
export default async function JobFilterPage({ params, searchParams }: Props) {
  const { filter } = await params;
  const { q } = await searchParams;

  if (isLegacyListingId(filter)) {
    const job = getJobById(filter);
    if (!job || isInternshipListing(job)) notFound();
    redirect(listingHref(job));
  }

  const initialFilters = parseFilterSlug("jobs", filter, q);
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
