import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/firestore-users";
import { jsonError, jsonOk } from "@/lib/api";

/** Session probe used after Google auth to route new vs returning users. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return jsonError("Unauthorized", 401);

  const user = await getUserById(session.user.id);
  if (!user) return jsonError("Unauthorized", 401);

  const onboardingComplete = Boolean(user.onboardingComplete);
  const isNewUser = !onboardingComplete;
  const hasResume = Boolean(user.resume || (user.resumes && user.resumes.length > 0));

  return jsonOk({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      onboardingComplete,
      isNewUser,
      hasResume,
      roles: session.user.roles,
    },
  });
}
