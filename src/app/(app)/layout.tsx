import { auth, signOut } from "@/lib/auth";
import { AppSidebar, MobileNav } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { CopilotWidget } from "@/components/career/copilot-widget";
import { redirect } from "next/navigation";

/** Session + Prisma pages — skip static generation when env/DB unavailable at build. */
export const dynamic = "force-dynamic";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  const isAdmin =
    session.user.roles?.includes("PLATFORM_ADMIN") || session.user.roles?.includes("INSTITUTION_ADMIN");

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
