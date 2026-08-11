import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/internships",
    "/jobs",
    "/events",
    "/hiring-flow",
    "/careers",
    "/auth/signin",
    "/auth/signup",
  ];

  const { DUMMY_JOBS, isInternshipListing } = await import("@/data/jobs");
  const detailPaths = DUMMY_JOBS.map((job) =>
    isInternshipListing(job) ? `/internships/${job.id}` : `/jobs/${job.id}`,
  );

  return [...staticPaths, ...detailPaths].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : path.includes("/jv-") ? 0.6 : 0.7,
  }));
}
