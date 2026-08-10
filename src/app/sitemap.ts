import type { MetadataRoute } from "next";

const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
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

  if (!process.env.DATABASE_URL) {
    return staticRoutes;
  }

  try {
    const { prisma } = await import("@/lib/db");
    const [opportunities, events, careers] = await Promise.all([
      prisma.opportunity.findMany({
        where: { status: "PUBLISHED" },
        select: { id: true, updatedAt: true },
        take: 200,
      }),
      prisma.event.findMany({
        where: { status: { in: ["PUBLISHED", "LIVE", "COMPLETED"] } },
        select: { id: true, updatedAt: true },
        take: 100,
      }),
      prisma.career.findMany({
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
    ]);

    return [
      ...staticRoutes,
      ...opportunities.map((o) => ({
        url: `${base}/opportunities/${o.id}`,
        lastModified: o.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
      ...events.map((e) => ({
        url: `${base}/events/${e.id}`,
        lastModified: e.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
      ...careers.map((c) => ({
        url: `${base}/careers`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
