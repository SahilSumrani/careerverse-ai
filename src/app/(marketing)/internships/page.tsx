import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { INTERNSHIP_FILTER_CHIPS } from "@/data/jobs";
import { listingsForKind, parseFilterSlug } from "@/data/listing-filters";
import { loadMarketingListings } from "@/lib/listings-public";

export const metadata: Metadata = {
  title: "Internships | CareerVerse AI",
  description:
    "Browse student internships on CareerVerse AI—work from home, hybrid, and on-site roles with stipends.",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function InternshipsMarketingPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const initialFilters = parseFilterSlug("internships", null, q);
  const all = await loadMarketingListings();
  const items = listingsForKind("internships", all);

  return (
    <ListingsBoard
      kind="internships"
      title="Internships"
      subtitle={
        items.length
          ? "Paid and mentored internships for students. Filter by category and apply with your CareerVerse profile."
          : "No published internships yet. Sign in to browse when roles go live."
      }
      items={items}
      filters={INTERNSHIP_FILTER_CHIPS}
      initialFilters={initialFilters}
      searchPlaceholder="e.g. Marketing, Delhi, Design"
    />
  );
}
