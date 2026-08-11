"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/states";

const TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/applications": "Applications",
  "/career": "Career intelligence",
  "/resume": "Resume",
  "/roadmap": "Roadmaps",
  "/copilot": "Copilot",
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

type Notif = {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
  isDemo?: boolean;
};

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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) {
        setItems(data.items || []);
        setUnread(data.unread ?? (data.items || []).filter((n: Notif) => !n.read).length);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAll() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

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
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) void load();
            }}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
            aria-label="Notifications"
            aria-expanded={open}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>
          {open ? (
            <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-sm font-semibold">Notifications</p>
                <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void markAll()}>
                  Mark all read
                </Button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : items.length ? (
                  items.map((n) => (
                    <div
                      key={n.id}
                      className={`border-b border-border/60 px-3 py-2.5 last:border-0 ${n.read ? "opacity-70" : "bg-muted/30"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{n.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {n.href ? (
                              <Link
                                href={n.href}
                                className="text-xs font-semibold text-primary hover:underline"
                                onClick={() => {
                                  void markRead(n.id);
                                  setOpen(false);
                                }}
                              >
                                Open
                              </Link>
                            ) : null}
                            {!n.read ? (
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => void markRead(n.id)}
                              >
                                Mark read
                              </button>
                            ) : null}
                            {n.isDemo ? <span className="text-[10px] text-muted-foreground">Demo</span> : null}
                          </div>
                        </div>
                        {!n.read ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" /> : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-sm text-muted-foreground">You’re all caught up.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
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
