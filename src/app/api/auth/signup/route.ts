import bcrypt from "bcryptjs";
import { createEmailPasswordUser, getUserByEmail } from "@/lib/firestore-users";
import { assignRole, ensureDefaultRoles } from "@/lib/rbac";
import { signUpSchema } from "@/lib/validators";
import { jsonError, jsonOk, trackAnalytics } from "@/lib/api";
import type { RoleName } from "@/lib/roles";
import { consumeWindowQuota } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid signup data", 400, { details: parsed.error.flatten() });

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const hour = new Date().toISOString().slice(0, 13);
    const allowed = await consumeWindowQuota("signup", email, 5, hour);
    if (!allowed) return jsonError("Too many signup attempts. Try again later.", 429);

    await ensureDefaultRoles();
    const existing = await getUserByEmail(email);
    if (existing) return jsonError("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const now = new Date().toISOString();

    let role: RoleName = "STUDENT";
    let nextPath = "/onboarding";

    if (data.track === "student") {
      role = data.role;
      const user = await createEmailPasswordUser({
        email,
        name: data.name,
        passwordHash,
        role,
        onboardingComplete: false,
        registration: { track: "student", submittedAt: now },
      });
      await assignRole(user.id, role);
      await trackAnalytics("signup", user.id, { track: "student", role });
      return jsonOk({ id: user.id, email: user.email, track: "student", next: nextPath });
    }

    if (data.track === "mentor") {
      role = "MENTOR";
      nextPath = "/dashboard";
      const skills = data.expertise
        .split(/[,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const user = await createEmailPasswordUser({
        email,
        name: data.name,
        passwordHash,
        role,
        onboardingComplete: true,
        profileCompleteness: 55,
        mentorApproved: false,
        headline: data.headline,
        about: data.bio,
        linkedinUrl: data.linkedinUrl || null,
        skills,
        registration: {
          track: "mentor",
          expertise: data.expertise,
          yearsExperience: data.yearsExperience,
          submittedAt: now,
        },
      });
      await assignRole(user.id, role);
      await trackAnalytics("signup", user.id, { track: "mentor", role });
      return jsonOk({
        id: user.id,
        email: user.email,
        track: "mentor",
        next: nextPath,
        pendingApproval: true,
      });
    }

    // Company HR — role granted, posting locked until recruiterApproved
    role = "HR";
    nextPath = "/dashboard";
    const user = await createEmailPasswordUser({
      email,
      name: data.name,
      passwordHash,
      role,
      onboardingComplete: true,
      profileCompleteness: 45,
      recruiterApproved: false,
      headline: `${data.jobTitle} at ${data.companyName}`,
      registration: {
        track: "hr",
        companyName: data.companyName,
        companyWebsite: data.companyWebsite || null,
        jobTitle: data.jobTitle,
        companySize: data.companySize ?? null,
        phone: data.phone || null,
        submittedAt: now,
      },
    });
    await assignRole(user.id, role);
    await trackAnalytics("signup", user.id, { track: "hr", role });
    return jsonOk({
      id: user.id,
      email: user.email,
      track: "hr",
      next: nextPath,
      pendingApproval: true,
    });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to create account", 500);
  }
}
