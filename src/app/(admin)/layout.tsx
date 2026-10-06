import { AppShell } from "@/components/app/shell";
import { requireStaff } from "@/lib/auth";

/** Back office. Only admin/owner accounts get past requireStaff; everyone else is sent to /dashboard. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  return <AppShell area="admin" profile={profile} staff>{children}</AppShell>;
}
