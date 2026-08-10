import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api";

/** Session probe used after Google auth to route new vs returning users. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true, resumes: { select: { id: true }, take: 1 } },
  });
  if (!user) return jsonError("Unauthorized", 401);

  const onboardingComplete = Boolean(user.profile?.onboardingComplete);
  // New = no completed onboarding (and typically just created)
  const isNewUser = !onboardingComplete;

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      onboardingComplete,
      isNewUser,
      hasResume: user.resumes.length > 0,
      roles: session.user.roles,
    },
  });
}
