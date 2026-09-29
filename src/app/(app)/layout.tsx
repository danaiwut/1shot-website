import Link from "next/link";
import { LogOut } from "lucide-react";
import { AppNav, MobileNav } from "@/components/app/nav";
import { Logo } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { isStaff } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer();
  const staff = isStaff(profile.role);
  const name = profile.display_name || profile.email.split("@")[0];
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-panel/60 px-3 py-5 lg:flex">
        <Link href="/" className="px-3 pb-7"><Logo /></Link>
        <AppNav staff={staff} />
        <div className="mt-auto rounded-xl border border-line bg-panel-2 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-gold-dim text-sm font-semibold text-gold uppercase">{name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-[11px] text-muted">{profile.email}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button className="rounded-md p-1.5 text-muted hover:bg-panel-3 hover:text-fg" aria-label="ออกจากระบบ" title="ออกจากระบบ">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
          <Link href="/"><Logo /></Link>
          <form action="/auth/signout" method="post">
            <button className="rounded-md p-2 text-muted" aria-label="ออกจากระบบ"><LogOut className="size-4" /></button>
          </form>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 lg:px-10 lg:pb-16">{children}</main>
      </div>
      <MobileNav staff={staff} />
    </div>
  );
}
