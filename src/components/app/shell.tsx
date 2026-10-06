import Link from "next/link";
import { LogOut } from "lucide-react";
import { AppNav, AreaSwitch, MobileNav, TopBar, type Area } from "@/components/app/nav";
import { Logo } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";

/** Frame shared by the customer area and the admin area; each passes its own `area`. */
export function AppShell({ area, profile, staff, children }: { area: Area; profile: Profile; staff: boolean; children: React.ReactNode }) {
  const name = profile.display_name || profile.email.split("@")[0];
  const admin = area === "admin";
  return (
    <div className="min-h-dvh bg-panel-2 lg:grid lg:grid-cols-[272px_1fr]">
      {/* WCAG 2.4.1: first tab stop jumps past the navigation. */}
      <a href="#main" className="sr-only z-[60] rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        ข้ามไปยังเนื้อหาหลัก
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col overflow-y-auto border-r border-line bg-panel px-4 py-6 lg:flex">
        <Link href={admin ? "/admin" : "/"} className="mb-7 self-start px-2" aria-label={admin ? "ภาพรวมระบบ" : "หน้าแรก"}><Logo tone="auto" /></Link>
        <div className="mb-6 border-y border-line px-2 py-4">
          <p className="text-xs font-semibold tracking-[0.13em] text-accent uppercase">{admin ? "1SHOT BUSINESS" : "1SHOT MEMBER"}</p>
          <p className="mt-1 text-sm text-muted">{admin ? "จัดการสินค้า ลูกค้า และบริการ" : "บัญชีและสิทธิ์ใช้งานของคุณ"}</p>
        </div>
        <AppNav area={area} />
        <div className="relative mt-auto space-y-3 pt-6">
          {staff && <AreaSwitch area={area} />}
          <div className="rounded-card border border-line bg-panel-2 p-3">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">{name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted">{staff ? ROLE_LABEL[profile.role] : profile.email}</p>
              </div>
              <form action="/auth/signout" method="post">
                <button className="rounded-md p-2 text-muted hover:bg-panel-3 hover:text-fg" aria-label="ออกจากระบบ" title="ออกจากระบบ">
                  <LogOut className="size-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-panel/95 px-4 backdrop-blur-xl lg:hidden">
          <Link href={admin ? "/admin" : "/"} className="flex items-center gap-2">
            <Logo tone="auto" />
            {admin && <span className="rounded bg-brand px-1.5 py-0.5 text-xs font-bold text-white">หลังบ้าน</span>}
          </Link>
          <Link href="/account" aria-label={`บัญชีของฉัน (${name})`} className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">
            <span aria-hidden>{name.slice(0, 1)}</span>
          </Link>
        </header>
        <TopBar area={area} />
        <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pt-6 pb-28 outline-none sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">{children}</main>
      </div>
      <MobileNav area={area} staff={staff} name={name} email={profile.email} />
    </div>
  );
}
