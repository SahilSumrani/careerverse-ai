import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { DUMMY_JOBS, INTERNSHIP_FILTER_CHIPS } from "@/data/jobs";
import { listingsForKind, parseFilterSlug } from "@/data/listing-filters";

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
