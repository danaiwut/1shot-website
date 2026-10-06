import { AppShell } from "@/components/app/shell";
import { requireViewer } from "@/lib/auth";
import { isStaff } from "@/lib/types";

/** Customer area. Staff can open it too (to see what customers see) and switch back to /admin. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  return <AppShell area="member" profile={profile} staff={isStaff(profile.role)}>{children}</AppShell>;
}
