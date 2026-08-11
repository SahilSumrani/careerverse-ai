import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CopilotWidget } from "@/components/career/copilot-widget";

/** Auth/Firestore-backed routes — never prerender at build. */
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
      <div className="min-h-screen overflow-x-hidden bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <AppSidebar isAdmin={isAdmin} userName={session.user.name} userEmail={session.user.email} />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <AppTopbar
          userName={session.user.name}
          userEmail={session.user.email}
          userImage={session.user.image}
          signOutAction={signOutAction}
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-28 md:px-7 md:pb-8">{children}</main>
      </div>
      <MobileNav isAdmin={isAdmin} />
      <Suspense fallback={null}>
        <CopilotWidget />
      </Suspense>
    </div>
  );
}
