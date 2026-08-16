import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpeningDetail } from "@/components/landing/opening-detail";
import { isInternshipListing } from "@/data/jobs";
import { resolveListingBySlug } from "@/lib/listings-public";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await resolveListingBySlug(slug);
  if (!job || !isInternshipListing(job)) return { title: "Internship | CareerVerse AI" };
  return {
    title: `${job.title} at ${job.company} | CareerVerse AI`,
    description: job.blurb,
  };
}

export default async function InternshipDetailSlugPage({ params }: Props) {
  const { slug } = await params;
  const job = await resolveListingBySlug(slug);
  if (!job || !isInternshipListing(job)) notFound();
  return <OpeningDetail job={job} kind="internship" />;
}
