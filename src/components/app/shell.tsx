import { cookies } from "next/headers";
import { AppHeader, AppSidebar, type Area } from "@/components/app/nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";

/** Frame shared by the customer area and the admin area (shadcn/ui sidebar layout). */
export async function AppShell({ area, profile, staff, children }: { area: Area; profile: Profile; staff: boolean; children: React.ReactNode }) {
  const name = profile.display_name || profile.email.split("@")[0];
  const open = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <SidebarProvider defaultOpen={open}>
      {/* WCAG 2.4.1: first tab stop jumps past the navigation. */}
      <a href="#main" className="sr-only z-[60] rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <AppSidebar area={area} viewer={{ name, email: profile.email, role: ROLE_LABEL[profile.role] ?? profile.role, staff }} />
      <SidebarInset className="min-w-0 bg-panel-2">
        <AppHeader area={area} staff={staff} />
        <div id="main" tabIndex={-1} className="w-full px-4 pt-8 pb-16 outline-none sm:px-6 lg:px-10">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
