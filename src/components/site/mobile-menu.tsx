"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";

/** Phone / tablet: the pill's menu button opens a rounded panel with the links centered. */
export function SiteMobileMenu({ links, signedIn, staff = false }: { links: { href: string; label: string }[]; signedIn: boolean; staff?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        className="grid size-11 place-items-center rounded-full bg-panel-3 text-fg transition-colors hover:bg-line"
      >
        {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
      </button>
      {open && (
        <div id="site-menu" className="absolute inset-x-0 top-full mt-3 animate-rise rounded-[2rem] border border-line bg-panel px-6 py-8 text-fg shadow-[0_24px_60px_-20px_rgb(0_0_0/0.5)]">
          <nav aria-label="เมนูหลัก" className="flex flex-col items-center gap-1">
            <Link href="/" onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center px-4 text-lg font-medium text-fg hover:text-accent">หน้าแรก</Link>
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="inline-flex min-h-12 items-center px-4 text-lg font-medium text-fg hover:text-accent">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mx-auto mt-6 grid max-w-xs gap-2">
            {signedIn ? (
              <Link href={staff ? "/admin" : "/dashboard"} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-fg text-sm font-semibold text-ink">
                {staff ? "ระบบหลังบ้าน" : "แดชบอร์ด"} <ArrowRight aria-hidden className="size-4" />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-fg text-sm font-semibold text-ink">
                  สมัครสมาชิก <ArrowRight aria-hidden className="size-4" />
                </Link>
                <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong text-sm font-medium text-fg">เข้าสู่ระบบ</Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
