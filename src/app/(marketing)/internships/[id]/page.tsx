import { redirect, notFound } from "next/navigation";
import { getJobById, isInternshipListing, listingHref } from "@/data/jobs";

type Props = { params: Promise<{ id: string }> };

/** Legacy `/internships/[id]` → Internshala-style `/internship/detail/...` slug. */
export default async function LegacyInternshipDetailRedirect({ params }: Props) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job || !isInternshipListing(job)) notFound();
  redirect(listingHref(job));
}
