import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const authPaths = ["/auth/signin", "/auth/signup", "/auth/forgot-password"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage = authPaths.some((p) => pathname.startsWith(p));
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/career") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/resume") ||
    pathname.startsWith("/roadmap") ||
    pathname.startsWith("/copilot") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/network") ||
    pathname.startsWith("/mentors") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/institutions");

  if (!session?.user && isProtected) {
    const url = new URL("/auth/signin", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (session?.user && isAuthPage) {
    const dest = session.user.onboardingComplete ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  if (session?.user && pathname.startsWith("/admin")) {
    const roles = session.user.roles || [];
    if (!roles.includes("PLATFORM_ADMIN") && !roles.includes("INSTITUTION_ADMIN")) {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
    }
  }

  if (
    session?.user &&
    !session.user.onboardingComplete &&
    !pathname.startsWith("/onboarding") &&
    isProtected &&
    !pathname.startsWith("/admin")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  const response = NextResponse.next();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/onboarding")) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/career/:path*",
    "/applications/:path*",
    "/resume/:path*",
    "/roadmap/:path*",
    "/copilot/:path*",
    "/community/:path*",
    "/network/:path*",
    "/mentors/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/institutions/:path*",
    "/auth/:path*",
  ],
};
