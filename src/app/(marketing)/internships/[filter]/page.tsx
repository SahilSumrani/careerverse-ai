import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingsBoard } from "@/components/landing/listings-board";
import {
  DUMMY_JOBS,
  INTERNSHIP_FILTER_CHIPS,
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
    title: `${label} | Internships | CareerVerse AI`,
    description: `Filtered internships on CareerVerse AI for ${label}.`,
  };
}

/** Internshala-style `/internships/{filter-slug}` (+ legacy `/internships/jv-*` redirect). */
export default async function InternshipFilterPage({ params, searchParams }: Props) {
  const { filter } = await params;
  const { q } = await searchParams;

  if (isLegacyListingId(filter)) {
    const job = getJobById(filter);
    if (!job || !isInternshipListing(job)) notFound();
    redirect(listingHref(job));
  }

  const initialFilters = parseFilterSlug("internships", filter, q);
  const items = listingsForKind("internships", DUMMY_JOBS);

  return (
    <ListingsBoard
      kind="internships"
      title="Internships"
      subtitle="Paid and mentored internships for students. Filter by category and apply with your CareerVerse profile."
      items={items}
      filters={INTERNSHIP_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Marketing, Delhi, Design"
    />
  );
}
