import { loadJobsFromFirestore, getJobById, type JobListing } from "@/lib/jobs-firestore";
import {
  type DummyJob,
  getJobBySlugFromList,
  filterHomeJobs,
  filterHomeInternships,
  listingHref,
} from "@/data/jobs";

export function jobListingToDummy(j: JobListing): DummyJob {
  return {
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    type: j.type,
    workMode: j.workMode,
    salary: j.salary || "—",
    tags: j.tags,
    blurb: j.blurb,
    activelyHiring: true,
  };
}

/** Public + marketing listings from Firestore only (empty OK). */
export async function loadMarketingListings(limit = 80): Promise<DummyJob[]> {
  const { jobs } = await loadJobsFromFirestore(limit);
  return jobs.map(jobListingToDummy);
}

export async function resolveListingBySlug(slug: string): Promise<DummyJob | null> {
  const jobs = await loadMarketingListings(100);
  const fromList = getJobBySlugFromList(jobs, slug);
  if (fromList) return fromList;
  // Trailing raw id (jv-1 or firestore id)
  const idMatch = slug.match(/([a-zA-Z0-9_-]+)$/);
  if (!idMatch) return null;
  const job = await getJobById(idMatch[1]);
  return job ? jobListingToDummy(job) : null;
}

export async function loadHomeListingBuckets() {
  const jobs = await loadMarketingListings(40);
  return {
    jobs: filterHomeJobs(jobs, 8),
    internships: filterHomeInternships(jobs, 8),
  };
}

export async function loadSitemapListingHrefs(): Promise<string[]> {
  const jobs = await loadMarketingListings(200);
  return jobs.map((j) => listingHref(j));
}
