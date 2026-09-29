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
    <div className="min-h-dvh bg-panel-2 lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="surface-dark sticky top-0 hidden h-dvh flex-col bg-ink px-3 py-5 lg:flex">
        <div className="brand-glow pointer-events-none absolute inset-x-0 bottom-0 h-72 opacity-40" />
        <Link href="/" className="relative px-3 pb-8"><Logo /></Link>
        <AppNav staff={staff} />
        <div className="relative mt-auto rounded-2xl border border-line bg-panel-2/80 p-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">{name.slice(0, 1)}</span>
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
        <header className="surface-dark sticky top-0 z-30 flex h-16 items-center justify-between bg-ink/95 px-4 backdrop-blur-xl lg:hidden">
          <Link href="/"><Logo /></Link>
          <Link href="/account" aria-label="บัญชีของฉัน" className="grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">
            {name.slice(0, 1)}
          </Link>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">{children}</main>
      </div>
      <MobileNav staff={staff} name={name} email={profile.email} />
    </div>
  );
}
