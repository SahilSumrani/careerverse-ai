import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpeningDetail } from "@/components/landing/opening-detail";
import { DUMMY_JOBS, getJobBySlug, isInternshipListing, listingSlug } from "@/data/jobs";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return DUMMY_JOBS.filter((j) => isInternshipListing(j)).map((j) => ({
    slug: listingSlug(j),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job || !isInternshipListing(job)) return { title: "Internship | CareerVerse AI" };
  return {
    title: `${job.title} at ${job.company} | CareerVerse AI`,
    description: job.blurb,
  };
}

export default async function InternshipDetailSlugPage({ params }: Props) {
  const { slug } = await params;
  const job = getJobBySlug(slug);
  if (!job || !isInternshipListing(job)) notFound();
  return <OpeningDetail job={job} kind="internship" />;
}
