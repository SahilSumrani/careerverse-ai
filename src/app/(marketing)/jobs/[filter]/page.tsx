import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingsBoard } from "@/components/landing/listings-board";
import { JOB_FILTER_CHIPS, isInternshipListing, listingHref } from "@/data/jobs";
import { isLegacyListingId, listingsForKind, parseFilterSlug } from "@/data/listing-filters";
import { loadMarketingListings, resolveListingBySlug } from "@/lib/listings-public";

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
    const job = await resolveListingBySlug(filter);
    if (!job || isInternshipListing(job)) notFound();
    redirect(listingHref(job));
  }

  const initialFilters = parseFilterSlug("jobs", filter, q);
  const all = await loadMarketingListings();
  const items = listingsForKind("jobs", all);

  return (
    <ListingsBoard
      kind="jobs"
      title="Jobs"
      subtitle={
        items.length
          ? "Fresher and early-career openings with clear salary bands. Sign in for explainable AI match scores."
          : "No published jobs yet. Sign in when openings go live."
      }
      items={items}
      filters={JOB_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Frontend, Bangalore, React"
    />
  );
}
