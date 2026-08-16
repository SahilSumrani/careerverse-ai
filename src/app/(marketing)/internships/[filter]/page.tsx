import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListingsBoard } from "@/components/landing/listings-board";
import { INTERNSHIP_FILTER_CHIPS, isInternshipListing, listingHref } from "@/data/jobs";
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
    title: `${label} | Internships | CareerVerse AI`,
    description: `Filtered internships on CareerVerse AI for ${label}.`,
  };
}

export default async function InternshipFilterPage({ params, searchParams }: Props) {
  const { filter } = await params;
  const { q } = await searchParams;

  if (isLegacyListingId(filter)) {
    const job = await resolveListingBySlug(filter);
    if (!job || !isInternshipListing(job)) notFound();
    redirect(listingHref(job));
  }

  const initialFilters = parseFilterSlug("internships", filter, q);
  const all = await loadMarketingListings();
  const items = listingsForKind("internships", all);

  return (
    <ListingsBoard
      kind="internships"
      title="Internships"
      subtitle={
        items.length
          ? "Paid and mentored internships for students. Filter by category and apply with your CareerVerse profile."
          : "No published internships yet. Sign in when roles go live."
      }
      items={items}
      filters={INTERNSHIP_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Marketing, Delhi, Design"
    />
  );
}
