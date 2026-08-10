import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: {
          include: {
            profile: true,
            roles: { include: { role: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return jsonOk({ mentors });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to load mentors", 500);
  }
}
