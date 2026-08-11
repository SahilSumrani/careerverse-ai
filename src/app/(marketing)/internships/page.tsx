import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { getHomeInternships, INTERNSHIP_FILTER_CHIPS } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Internships | CareerVerse AI",
  description:
    "Browse student internships on CareerVerse AI—work from home, hybrid, and on-site roles with stipends.",
};

export default function InternshipsMarketingPage() {
  const internships = getHomeInternships(40);

  return (
    <ListingsBoard
      kind="internships"
      title="Internships"
      subtitle="Paid and mentored internships for students. Filter by category and apply with your CareerVerse profile."
      items={internships}
      filters={INTERNSHIP_FILTER_CHIPS}
      searchPlaceholder="e.g. Marketing, Delhi, Design"
    />
  );
}
