"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Briefcase,
  Calendar,
  ClipboardList,
  Clock3,
  Compass,
  FileText,
  Home,
  LayoutDashboard,
  Network,
  Route,
  Search,
  Settings2,
  Shield,
  Sparkles,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

const studentMain = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/opportunities/browse", label: "Explore", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/career", label: "Intelligence", icon: Sparkles },
  { href: "/resume", label: "Resume", icon: FileText },
];

const studentGrow = [
  { href: "/roadmap", label: "Roadmaps", icon: Route },
  { href: "/copilot", label: "Copilot", icon: Compass },
  { href: "/network", label: "Network", icon: Network },
  { href: "/events/browse", label: "Events", icon: Calendar },
  { href: "/mentors", label: "Mentors", icon: Users },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminPrimary = [
  { href: "/admin", tab: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin?tab=users", tab: "users", label: "Users", icon: Users },
  { href: "/admin?tab=pending", tab: "pending", label: "Pending", icon: Clock3 },
  { href: "/admin?tab=registrations", tab: "registrations", label: "Registrations", icon: UserPlus },
  { href: "/admin?tab=activity", tab: "activity", label: "Activity", icon: Activity },
  { href: "/admin?tab=ops", tab: "ops", label: "Ops", icon: Settings2 },
];

const adminPlatform = [
  { href: "/opportunities/browse", label: "Browse jobs", icon: Briefcase },
  { href: "/recruiter", label: "Recruiter", icon: ClipboardList },
  { href: "/profile", label: "Account", icon: UserRound },
];

const mobilePrimary = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/opportunities/browse", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Apps", icon: ClipboardList },
  { href: "/roadmap", label: "Roadmap", icon: Route },
  { href: "/copilot", label: "Copilot", icon: Compass },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-sidebar-active text-sidebar-active-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function pathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar({
  isAdmin,
  isHr,
  userName,
  userEmail,
}: {
  isAdmin?: boolean;
  isHr?: boolean;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const adminTab = searchParams.get("tab") || "dashboard";

  return (
    <aside className="hidden w-[248px] shrink-0 overflow-clip bg-sidebar text-white md:block">
      <div className="sticky top-0 flex h-screen flex-col px-3 py-4">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="px-2 font-display text-xl tracking-tight text-white">
          CareerVerse <span className="text-blue-300">AI</span>
        </Link>

        {!isAdmin ? (
          <Link
            href="/opportunities/browse"
            className="mt-4 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm text-sidebar-foreground transition hover:bg-white/10 hover:text-white"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">Search jobs…</span>
          </Link>
        ) : (
          <p className="mt-4 rounded-2xl bg-blue-500/15 px-3 py-2 text-xs font-medium text-blue-200">
            Platform admin console
          </p>
        )}

        <nav className="no-scrollbar mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pb-2">
          {isAdmin ? (
            <>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Admin
                </p>
                <div className="space-y-0.5">
                  {adminPrimary.map((link) => (
                    <NavItem
                      key={link.tab}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      active={pathname.startsWith("/admin") && adminTab === link.tab}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                  Platform
                </p>
                <div className="space-y-0.5">
                  {adminPlatform.map((link) => (
                    <NavItem
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      active={pathActive(pathname, link.href)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Main</p>
                <div className="space-y-0.5">
                  {studentMain.map((link) => (
                    <NavItem
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      active={pathActive(pathname, link.href)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Grow</p>
                <div className="space-y-0.5">
                  {studentGrow.map((link) => (
                    <NavItem
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      active={pathActive(pathname, link.href)}
                    />
                  ))}
                  {isHr ? (
                    <NavItem
                      href="/recruiter"
                      label="Recruiter"
                      icon={Briefcase}
                      active={pathActive(pathname, "/recruiter")}
                    />
                  ) : null}
                </div>
              </div>
            </>
          )}
        </nav>

        <Link href="/profile" className="mt-2 shrink-0 rounded-2xl bg-white/5 p-2.5 transition hover:bg-white/10">
          <div className="flex items-center gap-2.5">
            <Avatar name={userName || userEmail} className="h-9 w-9 bg-blue-500/30 text-white" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{userName || "Member"}</p>
              <p className="truncate text-xs text-sidebar-foreground">{userEmail}</p>
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

export function MobileNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin
    ? [
        { href: "/admin", label: "Admin", icon: Shield },
        { href: "/admin?tab=users", label: "Users", icon: Users },
        { href: "/admin?tab=pending", label: "Pending", icon: Clock3 },
        { href: "/admin?tab=activity", label: "Live", icon: Activity },
        { href: "/profile", label: "You", icon: UserRound },
      ]
    : mobilePrimary;
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur md:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {items.map((link) => {
          const Icon = link.icon;
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === link.href.split("?")[0] || pathname.startsWith(`${link.href.split("?")[0]}/`);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium",
                  active ? "bg-accent text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
