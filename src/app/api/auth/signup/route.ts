import bcrypt from "bcryptjs";
import { createEmailPasswordUser, getUserByEmail } from "@/lib/firestore-users";
import { signUpSchema } from "@/lib/validators";
import { jsonError, jsonOk, readJsonBody, trackAnalytics } from "@/lib/api";
import type { RoleName } from "@/lib/roles";
import { consumeWindowQuota } from "@/lib/rate-limit";
import { sendWaitlistEmail } from "@/lib/email/waitlist";

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid signup data", 400, { details: parsed.error.flatten() });

    const data = parsed.data;
    const email = data.email.toLowerCase();
    const name = `${data.firstName} ${data.lastName}`.trim();
    const hour = new Date().toISOString().slice(0, 13);
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = (forwarded || req.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
    const [emailAllowed, ipAllowed, existing] = await Promise.all([
      consumeWindowQuota("signup", email, 5, hour),
      consumeWindowQuota("signup-ip", ip, 20, hour),
      getUserByEmail(email),
    ]);
    if (!emailAllowed || !ipAllowed) {
      return jsonError("Too many signup attempts. Try again later.", 429);
    }
    if (existing) return jsonError("An account with this email already exists", 409);

    // ponytail: bcrypt cost 10 balances password security and signup latency; upgrade when native hashing is available.
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    let role: RoleName = "STUDENT";

    if (data.track === "student") {
      role = data.role;
      const user = await createEmailPasswordUser({
        email,
        name,
        passwordHash,
        role,
        onboardingComplete: false,
        profileCompleteness: 30,
        linkedinUrl: data.linkedinUrl || null,
        skills: data.skills.split(",").map((skill) => skill.trim()).filter(Boolean).slice(0, 40),
        registration: {
          track: "student",
          phone: data.phone,
          city: data.city,
          state: data.state,
          educationLevel: data.educationLevel,
          institution: data.institution,
          course: data.course,
          graduationYear: data.graduationYear,
          preferredRole: data.preferredRole,
          hasResume: data.hasResume,
          submittedAt: now,
        },
      });
      void trackAnalytics("signup", user.id, { track: "student", role });
      await sendWaitlistEmail({ to: email, name });
      return jsonOk({
        ok: true,
        waitlist: true,
        id: user.id,
        email: user.email,
        track: "student",
        next: "/auth/waitlist",
      });
    }

    if (data.track === "mentor") {
      role = "PROFESSIONAL";
      const skills = data.expertise
        .split(/[,|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20);
      const user = await createEmailPasswordUser({
        email,
        name,
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
          phone: data.phone,
          jobTitle: data.jobTitle,
          currentOrganization: data.currentOrganization,
          expertise: data.expertise,
          yearsExperience: data.yearsExperience,
          mentoringExperience: data.mentoringExperience || null,
          motivation: data.motivation,
          achievements: data.achievements,
          availabilityDays: data.availabilityDays,
          hoursPerWeek: data.hoursPerWeek,
          languages: data.languages,
          menteeAudience: data.menteeAudience,
          submittedAt: now,
        },
      });
      void trackAnalytics("signup", user.id, { track: "mentor", role });
      await sendWaitlistEmail({ to: email, name });
      return jsonOk({
        ok: true,
        waitlist: true,
        id: user.id,
        email: user.email,
        track: "mentor",
        next: "/auth/waitlist",
        pendingApproval: true,
      });
    }

    // Company HR — role granted, posting locked until recruiterApproved
    role = "HR";
    const user = await createEmailPasswordUser({
      email,
      name,
      passwordHash,
      role,
      onboardingComplete: true,
      profileCompleteness: 45,
      recruiterApproved: false,
      headline: `${data.jobTitle} at ${data.companyName}`,
      registration: {
        track: "hr",
        companyName: data.companyName,
        companyType: data.companyType,
        registrationNumber: data.registrationNumber,
        gstNumber: data.gstNumber || null,
        industry: data.industry,
        companyWebsite: data.companyWebsite || null,
        jobTitle: data.jobTitle,
        companySize: data.companySize ?? null,
        phone: data.phone,
        address1: data.address1,
        address2: data.address2 || null,
        city: data.city,
        state: data.state,
        pinCode: data.pinCode,
        companyDescription: data.companyDescription,
        submittedAt: now,
      },
    });
    void trackAnalytics("signup", user.id, { track: "hr", role });
    await sendWaitlistEmail({ to: email, name });
    return jsonOk({
      ok: true,
      waitlist: true,
      id: user.id,
      email: user.email,
      track: "hr",
      next: "/auth/waitlist",
      pendingApproval: true,
    });
  } catch (e) {
    const status = (e as { status?: number }).status ?? 500;
    if (status === 400) return jsonError("Invalid JSON body", 400);
    if (status === 413) return jsonError("Request body too large", 413);
    console.error(e);
    return jsonError("Unable to create account", 500);
  }
}
