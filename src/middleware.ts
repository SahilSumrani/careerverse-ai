import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPaths = ["/auth/signin", "/auth/signup", "/auth/register", "/auth/forgot-password"];

function hasSecureSessionCookie(req: NextRequest) {
  return req.cookies
    .getAll()
    .some((c) => c.name.startsWith("__Secure-authjs.session-token"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.AUTH_SECRET;

  // Edge-safe JWT read only — do not import @/lib/auth (Prisma / Node deps).
  const decodedToken = secret
    ? await getToken({
        req,
        secret,
        secureCookie: hasSecureSessionCookie(req),
      })
    : null;
  const authExpiresAt =
    typeof decodedToken?.authExpiresAt === "number"
      ? decodedToken.authExpiresAt
      : typeof decodedToken?.iat === "number"
        ? decodedToken.iat * 1000 + 86_400_000
        : 0;
  const token = decodedToken && authExpiresAt > Date.now() ? decodedToken : null;

  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/career") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/resume") ||
    pathname.startsWith("/roadmap") ||
    pathname.startsWith("/copilot") ||
    pathname.startsWith("/network") ||
    pathname.startsWith("/mentors") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/institutions") ||
    pathname.startsWith("/opportunities/") ||
    pathname.startsWith("/events/");

  if (!token && isProtected) {
    const url = new URL("/auth/signin", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (token && isAuthPage) {
    const dest = token.onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (token && pathname.startsWith("/admin")) {
    const roles = (token.roles as string[] | undefined) || [];
    // Full console is PLATFORM_ADMIN only (ADMIN in Firestore maps to PLATFORM_ADMIN).
    if (!roles.includes("PLATFORM_ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  if (token && pathname.startsWith("/recruiter")) {
    const roles = (token.roles as string[] | undefined) || [];
    if (!roles.includes("HR") && !roles.includes("PLATFORM_ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  if (
    token &&
    !token.onboardingComplete &&
    !pathname.startsWith("/onboarding") &&
    isProtected &&
    !pathname.startsWith("/admin")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  const response = NextResponse.next();
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/recruiter") ||
    pathname.startsWith("/onboarding")
  ) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/career/:path*",
    "/applications/:path*",
    "/resume/:path*",
    "/roadmap/:path*",
    "/copilot/:path*",
    "/network/:path*",
    "/mentors/:path*",
    "/admin/:path*",
    "/recruiter/:path*",
    "/profile/:path*",
    "/institutions/:path*",
    "/opportunities/:path*",
    "/events/browse/:path*",
    "/events/:id",
    "/auth/:path*",
  ],
};
