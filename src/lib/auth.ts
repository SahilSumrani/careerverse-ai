import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assignRole, ensureDefaultRoles } from "@/lib/rbac";
import { verifyFirebaseIdToken } from "@/lib/firebase-id-token";
import { signInSchema } from "@/lib/validators";
import type { RoleName } from "@prisma/client";

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
  }
}

const providers = [
  Credentials({
    name: "Email and Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = signInSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: { include: { role: true } },
          profile: true,
        },
      });
      if (!user?.passwordHash || user.suspendedAt) return null;
      const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!valid) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        roles: user.roles.map((r) => r.role.name),
        onboardingComplete: user.profile?.onboardingComplete ?? false,
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
        const email = claims.email?.toLowerCase();
        if (!email) return null;

        await ensureDefaultRoles();

        let user = await prisma.user.findUnique({
          where: { email },
          include: {
            roles: { include: { role: true } },
            profile: true,
          },
        });

        if (user?.suspendedAt) return null;

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              name: claims.name ?? email.split("@")[0],
              image: typeof claims.picture === "string" ? claims.picture : null,
              emailVerified: claims.email_verified ? new Date() : null,
              profile: {
                create: {
                  onboardingComplete: false,
                  profileCompleteness: 15,
                },
              },
            },
            include: {
              roles: { include: { role: true } },
              profile: true,
            },
          });
          await assignRole(user.id, "STUDENT");
          user = await prisma.user.findUniqueOrThrow({
            where: { id: user.id },
            include: {
              roles: { include: { role: true } },
              profile: true,
            },
          });
        } else {
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: user.name || claims.name || undefined,
              image: user.image || (typeof claims.picture === "string" ? claims.picture : undefined),
              emailVerified: user.emailVerified ?? (claims.email_verified ? new Date() : null),
            },
            include: {
              roles: { include: { role: true } },
              profile: true,
            },
          });
          if (!user.roles.length) {
            await assignRole(user.id, "STUDENT");
            user = await prisma.user.findUniqueOrThrow({
              where: { id: user.id },
              include: {
                roles: { include: { role: true } },
                profile: true,
              },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          roles: user.roles.map((r) => r.role.name),
          onboardingComplete: user.profile?.onboardingComplete ?? false,
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
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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
      }
      if (trigger === "update" && session) {
        token.onboardingComplete = session.onboardingComplete ?? token.onboardingComplete;
        token.name = session.name ?? token.name;
      }
      if (token.id && (!token.roles || trigger === "update")) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            roles: { include: { role: true } },
            profile: true,
          },
        });
        if (dbUser) {
          token.roles = dbUser.roles.map((r) => r.role.name);
          token.onboardingComplete = dbUser.profile?.onboardingComplete ?? false;
          token.name = dbUser.name;
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
  trustHost: true,
  secret: process.env.AUTH_SECRET,
});
