import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import { upsertUserFromFirebaseClaims } from "@/lib/firebase-user";
import { getUserByEmailForAuth, getUserById } from "@/lib/firestore-users";
import { signInSchema } from "@/lib/validators";
import type { RoleName } from "@/lib/roles";
import { consumeWindowQuota } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      roles: RoleName[];
      onboardingComplete: boolean;
    };
  }

  interface User {
    roles?: RoleName[];
    onboardingComplete?: boolean;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    roles?: RoleName[];
    onboardingComplete?: boolean;
    authExpiresAt?: number;
  }
}

const providers = [
  Credentials({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const hour = new Date().toISOString().slice(0, 13);
      const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = (forwarded || request.headers.get("x-real-ip") || "unknown").slice(0, 128).replaceAll("/", "_");
      const [emailAllowed, ipAllowed] = await Promise.all([
        consumeWindowQuota("signin-email", email, 10, hour),
        consumeWindowQuota("signin-ip", ip, 50, hour),
      ]);
      if (!emailAllowed || !ipAllowed) return null;
      const user = await getUserByEmailForAuth(email);
      if (!user?.passwordHash || user.suspendedAt) return null;
      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: user.roles,
        onboardingComplete: user.onboardingComplete,
      };
    },
  }),
  Credentials({
    id: "firebase",
    name: "Firebase",
    credentials: {
      idToken: { label: "Firebase ID Token", type: "text" },
    },
    async authorize(credentials) {
      const idToken = credentials?.idToken;
      if (!idToken || typeof idToken !== "string") return null;

      try {
        const claims = await verifyFirebaseIdToken(idToken);
        const user = await upsertUserFromFirebaseClaims(claims);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: user.roles,
          onboardingComplete: user.onboardingComplete,
        };
      } catch (error) {
        console.error("Firebase auth bridge failed", error);
        return null;
      }
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }) as never,
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // JWT only — no Prisma adapter (Edge middleware stays Prisma-free)
  session: { strategy: "jwt", maxAge: 86_400 },
  jwt: { maxAge: 86_400 },
  pages: {
    signIn: "/auth/signin",
    newUser: "/onboarding",
  },
  providers,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles ?? ["STUDENT"];
        token.onboardingComplete = user.onboardingComplete ?? false;
        token.authExpiresAt = Date.now() + 86_400_000;
      }
      token.authExpiresAt ??= typeof token.iat === "number" ? token.iat * 1000 + 86_400_000 : 0;
      if (token.authExpiresAt <= Date.now()) return null;
      if (trigger === "update" && session) {
        token.onboardingComplete = session.onboardingComplete ?? token.onboardingComplete;
        token.name = session.name ?? token.name;
      }
      if (token.id) {
        try {
          const dbUser = await getUserById(token.id as string);
          if (!dbUser || dbUser.suspendedAt) return null;
          token.roles = dbUser.roles;
          token.onboardingComplete = dbUser.onboardingComplete;
          token.name = dbUser.name;
        } catch (error) {
          console.error("Firestore session refresh failed", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as RoleName[]) ?? [];
        session.user.onboardingComplete = Boolean(token.onboardingComplete);
      }
      return session;
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
