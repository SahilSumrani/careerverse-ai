"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/applications": "Applications",
  "/career": "Career intelligence",
  "/resume": "Resume",
  "/roadmap": "Roadmaps",
  "/copilot": "Copilot",
  "/community": "Community",
  "/network": "Network",
  "/mentors": "Mentors",
  "/profile": "Profile",
  "/institutions": "Institutions",
  "/admin": "Admin",
  "/opportunities/browse": "Explore jobs",
  "/events/browse": "Events",
};

function titleForPath(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/opportunities/")) return "Opportunity";
  if (pathname.startsWith("/events/")) return "Event";
  if (pathname.startsWith("/careers")) return "Careers";
  const match = Object.keys(TITLES).find((key) => pathname.startsWith(key) && key !== "/");
  return match ? TITLES[match] : "CareerVerse";
}

export function AppTopbar({
  userName,
  userEmail,
  userImage,
  signOutAction,
}: {
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const title = titleForPath(pathname);
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-7">
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold tracking-tight text-foreground">{title}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <CalendarDays className="h-3.5 w-3.5" />
          {today}
        </div>
        <Link
          href="/dashboard"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
          aria-label="Activity on dashboard"
          title="Open dashboard activity"
        >
          <Bell className="h-4 w-4" />
        </Link>
        <Link href="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3">
          <Avatar name={userName || userEmail} src={userImage} className="h-8 w-8" />
          <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">{userName || "Profile"}</span>
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="hidden rounded-full px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:inline"
          >
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
