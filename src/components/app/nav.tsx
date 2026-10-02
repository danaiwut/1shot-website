"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, CreditCard, LayoutDashboard, Mail, LogOut, Menu, Newspaper, Package, Receipt, Settings2, ShieldHalf, ShoppingBag, SlidersHorizontal, Users, Webhook, X,
} from "lucide-react";
import { cx } from "@/components/ui";

const MEMBER = [
  { href: "/dashboard", label: "ภาพรวม", short: "ภาพรวม", icon: LayoutDashboard },
  { href: "/signals", label: "สัญญาณ", short: "สัญญาณ", icon: Activity },
  { href: "/store", label: "ร้านค้า", short: "ร้านค้า", icon: ShoppingBag },
  { href: "/billing", label: "การชำระเงิน", short: "ชำระเงิน", icon: CreditCard },
  { href: "/news", label: "ข่าวและสรุปตลาด", short: "ข่าว", icon: Newspaper },
  { href: "/account", label: "บัญชีของฉัน", short: "บัญชี", icon: Settings2 },
];
/** Bottom tab bar on phones; everything else lives in the "เมนู" sheet. */
const TABS = ["/dashboard", "/signals", "/store", "/account"];
const STAFF = [
  { href: "/admin", label: "สมาชิก", short: "สมาชิก", icon: Users },
  { href: "/admin/orders", label: "คำสั่งซื้อ", short: "คำสั่งซื้อ", icon: Receipt },
  { href: "/admin/products", label: "สินค้าและราคา", short: "สินค้า", icon: Package },
  { href: "/admin/emails", label: "อีเมลที่ส่ง", short: "อีเมล", icon: Mail },
  { href: "/admin/indicators", label: "อินดิเคเตอร์และห้อง", short: "อินดิเคเตอร์", icon: SlidersHorizontal },
  { href: "/admin/webhooks", label: "บันทึก Webhook", short: "Webhook", icon: Webhook },
];
type Item = (typeof MEMBER)[number];

function useActive() {
  const path = usePathname();
  return (href: string) =>
    href === "/admin" ? path === "/admin" || path.startsWith("/admin/members") : path === href || path.startsWith(`${href}/`);
}

export function AppNav({ staff }: { staff: boolean }) {
  const active = useActive();
  const item = (i: Item) => (
    <Link
      key={i.href}
      href={i.href}
      aria-current={active(i.href) ? "page" : undefined}
      className={cx(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active(i.href) ? "bg-brand text-white shadow-[0_10px_24px_-12px_rgb(178_0_22/0.8)]" : "text-muted hover:bg-panel-3 hover:text-fg",
      )}
    >
      <i.icon className="size-4" strokeWidth={1.8} />
      {i.label}
    </Link>
  );
  return (
    <nav className="relative space-y-6">
      <div className="space-y-0.5">{MEMBER.map(item)}</div>
      {staff && (
        <div className="space-y-0.5">
          <p className="flex items-center gap-2 px-3 pb-1.5 text-[11px] font-medium tracking-wider text-faint uppercase">
            <ShieldHalf className="size-3.5" /> ผู้ดูแล
          </p>
          {STAFF.map(item)}
        </div>
      )}
    </nav>
  );
}

/** Bottom tab bar + a sheet holding every destination (staff pages included) on small screens. */
export function MobileNav({ staff, name, email }: { staff: boolean; name: string; email: string }) {
  const active = useActive();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  const inSheet = [...MEMBER.filter((i) => !TABS.includes(i.href)), ...STAFF].some((i) => active(i.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {MEMBER.filter((i) => TABS.includes(i.href)).map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={cx("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium", active(i.href) ? "text-accent" : "text-muted")}
          >
            <i.icon className="size-5" strokeWidth={1.7} />
            {i.short}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-sheet"
          className={cx("flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium", inSheet || open ? "text-accent" : "text-muted")}
        >
          <Menu className="size-5" strokeWidth={1.7} />
          เมนู
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="เมนู" id="mobile-sheet">
          <button type="button" aria-label="ปิดเมนู" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="surface-dark absolute inset-x-0 bottom-0 max-h-[85dvh] animate-rise overflow-y-auto rounded-t-3xl bg-ink px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
            <div className="mb-4 flex items-center gap-3 px-1">
              <span className="grid size-10 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">{name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted">{email}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-muted hover:bg-panel-3" aria-label="ปิด">
                <X className="size-5" />
              </button>
            </div>
            <AppNav staff={staff} />
            <form action="/auth/signout" method="post" className="mt-4 border-t border-line pt-4">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-panel-3 hover:text-fg">
                <LogOut className="size-4" /> ออกจากระบบ
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
