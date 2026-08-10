import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assignRole, ensureDefaultRoles } from "@/lib/rbac";
import { signUpSchema } from "@/lib/validators";
import { jsonError, jsonOk, trackAnalytics } from "@/lib/api";
import type { RoleName } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid signup data", 400, { details: parsed.error.flatten() });

    await ensureDefaultRoles();
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return jsonError("An account with this email already exists", 409);

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        profile: {
          create: {
            onboardingComplete: false,
            profileCompleteness: 10,
          },
        },
      },
    });
    await assignRole(user.id, parsed.data.role as RoleName);
    await trackAnalytics("signup", user.id, { role: parsed.data.role });
    return jsonOk({ id: user.id, email: user.email });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to create account", 500);
  }
}
