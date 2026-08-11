import type { Metadata } from "next";
import { ListingsBoard } from "@/components/landing/listings-board";
import { getHomeJobs, JOB_FILTER_CHIPS, DUMMY_JOBS } from "@/data/jobs";

export const metadata: Metadata = {
  title: "Jobs | CareerVerse AI",
  description:
    "Browse fresher and early-career jobs on CareerVerse AI—filters, stipends, and apply paths for students.",
};

export default function JobsMarketingPage() {
  const jobs = getHomeJobs(40);
  const fallback = jobs.length ? jobs : DUMMY_JOBS.filter((j) => j.type !== "Internship");

  return (
    <ListingsBoard
      kind="jobs"
      title="Jobs"
      subtitle="Fresher and early-career openings with clear salary bands. Sign in for explainable AI match scores."
      items={fallback}
      filters={JOB_FILTER_CHIPS}
      searchPlaceholder="e.g. Frontend, Bangalore, React"
    />
  );
}
