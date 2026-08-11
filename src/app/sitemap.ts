import type { MetadataRoute } from "next";

const base = (
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

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

  const { DUMMY_JOBS, listingHref } = await import("@/data/jobs");
  const detailPaths = DUMMY_JOBS.map((job) => listingHref(job));

  const filterPaths = [
    "/internships/work-from-home",
    "/internships/internship-in-bangalore",
    "/internships/marketing-internship",
    "/jobs/work-from-home",
    "/jobs/jobs-in-bangalore",
    "/jobs/engineering-jobs",
  ];

  return [...staticPaths, ...filterPaths, ...detailPaths].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : path.includes("/detail/") ? 0.6 : 0.7,
  }));
}
