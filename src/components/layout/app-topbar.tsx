import Link from "next/link";
import { Bell, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth";

export function AppTopbar({
  title,
  userName,
  userEmail,
  userImage,
}: {
  title?: string;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 backdrop-blur md:px-7">
      <div>
        <p className="text-lg font-semibold tracking-tight text-foreground">{title || "Overview"}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
          <CalendarDays className="h-3.5 w-3.5" />
          {today}
        </div>
        <Link
          href="/dashboard"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </Link>
        <Link href="/profile" className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3">
          <Avatar name={userName || userEmail} src={userImage} className="h-8 w-8" />
          <span className="hidden max-w-[120px] truncate text-xs font-medium sm:inline">{userName || "Profile"}</span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
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
