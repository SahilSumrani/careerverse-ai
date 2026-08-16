import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?stale=1");
  if (!session.user.roles.includes("PLATFORM_ADMIN")) redirect("/dashboard");
  return children;
}
