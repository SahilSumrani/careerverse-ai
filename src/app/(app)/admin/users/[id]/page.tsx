import { notFound } from "next/navigation";
import { requireSession } from "@/lib/api";
import { PERMISSIONS, requirePermission } from "@/lib/rbac";
import { AdminUserDetail } from "./user-detail";

const USER_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  await requirePermission(session.user.id, PERMISSIONS.ADMIN_ACCESS);

  const { id } = await params;
  if (!USER_ID_PATTERN.test(id)) notFound();

  return <AdminUserDetail id={id} currentAdminId={session.user.id} />;
}
