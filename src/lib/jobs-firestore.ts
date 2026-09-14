import { hasFirebaseAdminCredentials, getAdminDb } from "@/lib/firebase-admin";

export type JobListing = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  salary?: string;
  tags: string[];
  blurb: string;
  isDemo?: boolean;
};

function mapJobDoc(id: string, data: Record<string, unknown>, fromOpportunities = false): JobListing {
  const tagsRaw = fromOpportunities ? data.skills || data.tags : data.tags || data.skills;
  return {
    id,
    title: String(data.title || "Role"),
    company: String(
      fromOpportunities
        ? data.organizationName || data.company || "Company"
        : data.company || data.organizationName || "Company",
    ),
    location: String(data.location || "TBA"),
    type: String(data.type || "Full-time"),
    workMode: String(data.workMode || "Hybrid"),
    salary: data.salary != null && data.salary !== "" ? String(data.salary) : undefined,
    tags: Array.isArray(tagsRaw) ? tagsRaw.map(String) : [],
    blurb: String(
      fromOpportunities ? data.description || data.blurb || "" : data.blurb || data.description || "",
    ),
    isDemo: Boolean(data.isDemo),
  };
}

let cachedJobsResult: { jobs: JobListing[]; source: string; timestamp: number; limit: number } | null = null;
const JOBS_CACHE_TTL_MS = 60_000; // 60 seconds

/** Load published jobs from Firestore with in-memory TTL caching. */
export async function loadJobsFromFirestore(limit = 40): Promise<{ jobs: JobListing[]; source: string }> {
  const now = Date.now();
  if (cachedJobsResult && cachedJobsResult.limit >= limit && now - cachedJobsResult.timestamp < JOBS_CACHE_TTL_MS) {
    return { jobs: cachedJobsResult.jobs.slice(0, limit), source: cachedJobsResult.source };
  }

  if (!hasFirebaseAdminCredentials()) {
    return { jobs: [], source: "unconfigured" };
  }
  try {
    const jobsSnap = await getAdminDb().collection("jobs").limit(limit).get();
    if (!jobsSnap.empty) {
      const jobs = jobsSnap.docs
        .map((d) => mapJobDoc(d.id, d.data() as Record<string, unknown>, false))
        .filter((j) => !j.isDemo);
      cachedJobsResult = { jobs, source: "firestore", timestamp: now, limit };
      return { jobs, source: "firestore" };
    }
    const oppSnap = await getAdminDb().collection("opportunities").limit(limit).get();
    if (!oppSnap.empty) {
      const jobs = oppSnap.docs
        .map((d) => mapJobDoc(d.id, d.data() as Record<string, unknown>, true))
        .filter((j) => !j.isDemo);
      cachedJobsResult = { jobs, source: "firestore", timestamp: now, limit };
      return { jobs, source: "firestore" };
    }
    cachedJobsResult = { jobs: [], source: "firestore", timestamp: now, limit };
    return { jobs: [], source: "firestore" };
  } catch {
    return { jobs: [], source: "error" };
  }
}

export async function getJobById(id: string): Promise<JobListing | null> {
  if (!hasFirebaseAdminCredentials()) return null;
  try {
    const jobDoc = await getAdminDb().collection("jobs").doc(id).get();
    if (jobDoc.exists) {
      const job = mapJobDoc(jobDoc.id, jobDoc.data() as Record<string, unknown>, false);
      return job.isDemo ? null : job;
    }
    const oppDoc = await getAdminDb().collection("opportunities").doc(id).get();
    if (oppDoc.exists) {
      const job = mapJobDoc(oppDoc.id, oppDoc.data() as Record<string, unknown>, true);
      return job.isDemo ? null : job;
    }
    return null;
  } catch {
    return null;
  }
}
