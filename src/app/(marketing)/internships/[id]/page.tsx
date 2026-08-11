import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpeningDetail } from "@/components/landing/opening-detail";
import { DUMMY_JOBS, getJobById, isInternshipListing } from "@/data/jobs";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return DUMMY_JOBS.filter((j) => isInternshipListing(j)).map((j) => ({ id: j.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = getJobById(id);
  if (!job || !isInternshipListing(job)) return { title: "Internship | CareerVerse AI" };
  return {
    title: `${job.title} at ${job.company} | CareerVerse AI`,
    description: job.blurb,
  };
}

export default async function InternshipDetailPage({ params }: Props) {
  const { id } = await params;
  const job = getJobById(id);
  if (!job || !isInternshipListing(job)) notFound();
  return <OpeningDetail job={job} kind="internships" />;
}
