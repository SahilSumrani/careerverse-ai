import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CopilotWidget } from "@/components/career/copilot-widget";
import { redirect } from "next/navigation";
import { rememberShellProfile, peekShellProfile } from "@/lib/shell-profile-cache";

/** Session + Firestore pages — skip static generation when env/DB unavailable at build. */
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?stale=1");

  const cached = peekShellProfile(session.user.id);
  const userName = session.user.name ?? cached?.name ?? null;
  const userEmail = session.user.email ?? cached?.email ?? null;
  const userImage = session.user.image ?? cached?.image ?? null;
  rememberShellProfile({
    id: session.user.id,
    name: userName,
    email: userEmail,
    image: userImage,
    roles: session.user.roles ?? cached?.roles,
  });

  const roles = session.user.roles ?? cached?.roles ?? [];
  const isAdmin = roles.includes("PLATFORM_ADMIN");
  const isHr = roles.includes("HR");

  return (
    <div className="flex min-h-screen overflow-x-clip bg-background">
      <AppSidebar isAdmin={isAdmin} isHr={isHr} userName={userName} userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <AppTopbar
          userName={userName}
          userEmail={userEmail}
          userImage={userImage}
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
