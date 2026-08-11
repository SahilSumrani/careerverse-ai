import { auth, signOut } from "@/lib/auth";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CopilotWidget } from "@/components/career/copilot-widget";

/** DB/auth-backed routes — never prerender at build (Vercel may lack DATABASE_URL). */
export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin =
    session?.user?.roles?.includes("PLATFORM_ADMIN") || session?.user?.roles?.includes("INSTITUTION_ADMIN");

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isAdmin={isAdmin} userName={session.user.name} userEmail={session.user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          signOutAction={signOutAction}
        />
        <main className="flex-1 px-4 py-6 pb-28 md:px-7 md:pb-8">{children}</main>
      </div>
      <MobileNav isAdmin={isAdmin} />
      <CopilotWidget />
    </div>
  );
}
