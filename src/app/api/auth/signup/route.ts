import bcrypt from "bcryptjs";
import { createEmailPasswordUser, getUserByEmail } from "@/lib/firestore-users";
import { assignRole, ensureDefaultRoles } from "@/lib/rbac";
import { signUpSchema } from "@/lib/validators";
import { jsonError, jsonOk, trackAnalytics } from "@/lib/api";
import type { RoleName } from "@/lib/roles";
import { isRoleName } from "@/lib/roles";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid signup data", 400, { details: parsed.error.flatten() });

    await ensureDefaultRoles();
    const email = parsed.data.email.toLowerCase();
    const existing = await getUserByEmail(email);
    if (existing) return jsonError("An account with this email already exists", 409);

    const role = isRoleName(parsed.data.role) ? (parsed.data.role as RoleName) : "STUDENT";
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await createEmailPasswordUser({
      email,
      name: parsed.data.name,
      passwordHash,
      role,
    });
    await assignRole(user.id, role);
    await trackAnalytics("signup", user.id, { role });
    return jsonOk({ id: user.id, email: user.email });
  } catch (e) {
    console.error(e);
    return jsonError("Unable to create account", 500);
  }
}
