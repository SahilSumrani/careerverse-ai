import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    "",
    "/internships",
    "/jobs",
    "/opportunities",
    "/events",
    "/hiring-flow",
    "/careers",
    "/auth/signin",
    "/auth/signup",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "daily",
    priority: path === "" ? 1 : 0.7,
  }));
}
