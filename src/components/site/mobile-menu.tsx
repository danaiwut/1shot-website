"use client";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/ui";

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
        className="grid size-10 place-items-center rounded-xl border border-line-strong text-fg"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>
      {open && (
        <div id="site-menu" className="absolute inset-x-0 top-full animate-rise border-b border-line bg-ink px-4 pt-2 pb-5">
          <nav className="flex flex-col">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-3.5 text-base text-fg">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {signedIn ? (
              <ButtonLink href={staff ? "/admin" : "/dashboard"} className="col-span-2 h-11">{staff ? "ระบบหลังบ้าน" : "เข้าสู่แดชบอร์ด"} <ArrowRight className="size-4" /></ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="outline" className="h-11">เข้าสู่ระบบ</ButtonLink>
                <ButtonLink href="/signup" className="h-11">สมัครสมาชิก</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
