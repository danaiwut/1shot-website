"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, ArrowLeftRight, ChevronRight, CreditCard, FileText, Gauge, LayoutDashboard, LogOut, Mail, Menu, Newspaper, Package,
  BookOpen, ClipboardList, History, LifeBuoy, Megaphone, Receipt, ScrollText, Settings2, UserCog, ShieldHalf, ShoppingBag, SlidersHorizontal, Users, Webhook, X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme";
import { cx } from "@/components/ui";

/*
 * Two separate areas share these components:
 *   member — what a customer sees (/dashboard, /signals, /store …)
 *   admin  — the back office (/admin …), staff only
 * Staff can switch between them; customers never see admin navigation.
 */
export type Area = "member" | "admin";

const MEMBER = [
  { href: "/dashboard", label: "ภาพรวม", short: "ภาพรวม", icon: LayoutDashboard },
  { href: "/signals", label: "สัญญาณ", short: "สัญญาณ", icon: Activity },
  { href: "/store", label: "ร้านค้า", short: "ร้านค้า", icon: ShoppingBag },
  { href: "/billing", label: "การชำระเงิน", short: "ชำระเงิน", icon: CreditCard },
  { href: "/news", label: "ข่าวและสรุปตลาด", short: "ข่าว", icon: Newspaper },
  { href: "/announcements", label: "ประกาศ", short: "ประกาศ", icon: Megaphone },
  { href: "/support", label: "คำขอและความช่วยเหลือ", short: "ช่วยเหลือ", icon: LifeBuoy },
  { href: "/guide", label: "คู่มือการใช้งาน", short: "คู่มือ", icon: BookOpen },
  { href: "/activity", label: "ประวัติของฉัน", short: "ประวัติ", icon: History },
  { href: "/account", label: "บัญชีของฉัน", short: "บัญชี", icon: Settings2 },
];
const ADMIN = [
  { href: "/admin", label: "ภาพรวมระบบ", short: "ภาพรวม", icon: Gauge },
  { href: "/admin/work", label: "ศูนย์งาน", short: "ศูนย์งาน", icon: ClipboardList },
  { href: "/admin/support", label: "คำขอจากสมาชิก", short: "คำขอ", icon: LifeBuoy },
  { href: "/admin/members", label: "ข้อมูลลูกค้า", short: "ลูกค้า", icon: Users },
  { href: "/admin/orders", label: "คำสั่งซื้อ", short: "คำสั่งซื้อ", icon: Receipt },
  { href: "/admin/products", label: "สินค้าและราคา", short: "สินค้า", icon: Package },
  { href: "/admin/content", label: "ข่าวและสรุปเช้า", short: "ข่าว", icon: FileText },
  { href: "/admin/announcements", label: "ประกาศ", short: "ประกาศ", icon: Megaphone },
  { href: "/admin/access-history", label: "ประวัติการจัดการสิทธิ์", short: "ประวัติสิทธิ์", icon: ScrollText },
  { href: "/admin/team", label: "ทีมงาน", short: "ทีมงาน", icon: UserCog },
  { href: "/admin/emails", label: "อีเมลที่ส่ง", short: "อีเมล", icon: Mail },
  { href: "/admin/indicators", label: "อินดิเคเตอร์และห้อง", short: "อินดิเคเตอร์", icon: SlidersHorizontal },
  { href: "/admin/webhooks", label: "บันทึก Webhook", short: "Webhook", icon: Webhook },
];
type Item = (typeof MEMBER)[number];

const AREA = {
  member: { items: MEMBER, tabs: ["/dashboard", "/signals", "/store", "/account"], title: "สมาชิก" },
  admin: { items: ADMIN, tabs: ["/admin", "/admin/members", "/admin/orders", "/admin/products"], title: "ผู้ดูแลระบบ" },
} as const;

const matches = (path: string, href: string) => (href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`));

function useActive() {
  const path = usePathname();
  return (href: string) => matches(path, href);
}

/** Link to the other area, shown to staff only. */
export function AreaSwitch({ area, className }: { area: Area; className?: string }) {
  const toAdmin = area === "member";
  return (
    <Link
      href={toAdmin ? "/admin" : "/dashboard"}
      className={cx(
        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        toAdmin ? "border-brand/40 bg-brand-dim text-accent hover:bg-brand hover:text-white" : "border-line-strong text-muted hover:border-fg hover:text-fg",
        className,
      )}
    >
      {toAdmin ? <ShieldHalf className="size-4" /> : <ArrowLeftRight className="size-4" />}
      {toAdmin ? "ไปหน้าผู้ดูแลระบบ" : "ดูมุมมองลูกค้า"}
    </Link>
  );
}

export function AppNav({ area }: { area: Area }) {
  const active = useActive();
  const item = (i: Item) => {
    const on = active(i.href);
    return (
      <li key={i.href}>
        <Link
          href={i.href}
          aria-current={on ? "page" : undefined}
          className={cx(
            "relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors",
            on ? "bg-brand font-semibold text-white" : "text-muted hover:bg-panel-2 hover:text-fg",
          )}
        >
          {/* Bar + weight mark the current page, not colour alone (WCAG 1.4.1). */}
          {on && <span aria-hidden className="absolute inset-y-1.5 -left-3 w-1 rounded-r-full bg-brand" />}
          <i.icon className={cx("size-4", on && "text-white")} strokeWidth={on ? 2.2 : 1.8} />
          {i.label}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label={area === "admin" ? "เมนูผู้ดูแลระบบ" : "เมนูหลัก"} className="relative">
      <h2 className="flex items-center gap-2 px-3 pb-1.5 text-xs font-medium tracking-wider text-faint uppercase">
        {area === "admin" && <ShieldHalf className="size-3.5" />}
        {area === "admin" ? "ผู้ดูแลระบบ" : "เมนู"}
      </h2>
      <ul className="space-y-1.5">{AREA[area].items.map(item)}</ul>
    </nav>
  );
}

/** Desktop top bar: where you are (area › page) and the Bangkok clock traders work by. */
export function TopBar({ area }: { area: Area }) {
  const path = usePathname();
  const items: readonly Item[] = AREA[area].items;
  const here = items.find((i) => matches(path, i.href));
  const deeper = here && path !== here.href;
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center justify-between gap-4 border-b border-line bg-panel/90 px-10 backdrop-blur-xl lg:flex">
      <nav aria-label="ตำแหน่งปัจจุบัน">
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          <li className={cx(area === "admin" && "flex items-center gap-1.5 font-medium text-accent")}>
            {area === "admin" && <ShieldHalf className="size-3.5" />}{AREA[area].title}
          </li>
          {here && (
            <>
              <li aria-hidden><ChevronRight className="size-3.5 text-faint" /></li>
              <li>{deeper ? <Link href={here.href} className="underline-offset-4 hover:text-fg hover:underline">{here.label}</Link> : <span aria-current="page" className="font-medium text-fg">{here.label}</span>}</li>
            </>
          )}
          {deeper && (
            <>
              <li aria-hidden><ChevronRight className="size-3.5 text-faint" /></li>
              <li><span aria-current="page" className="font-medium text-fg">รายละเอียด</span></li>
            </>
          )}
        </ol>
      </nav>
      <div className="flex items-center gap-4">
        <BangkokClock />
        <ThemeToggle />
        {area === "member" && (
          <Link href="/store" className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-medium text-white hover:bg-brand-strong">
            <ShoppingBag className="size-3.5" /> ซื้อ / ต่ออายุ
          </Link>
        )}
      </div>
    </header>
  );
}

function BangkokClock() {
  const [now, setNow] = useState<string>();
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", weekday: "short", day: "numeric", month: "short" });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, []);
  // Not a live region: a ticking clock should not interrupt screen readers.
  return <span className="num text-xs text-muted">{now ? `${now} น. (เวลาไทย)` : ""}</span>;
}

/** Bottom tab bar + a modal sheet holding every destination of the area on small screens. */
export function MobileNav({ area, staff, name, email }: { area: Area; staff: boolean; name: string; email: string }) {
  const active = useActive();
  const path = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const { items, tabs } = AREA[area];
  const inSheet = items.filter((i) => !(tabs as readonly string[]).includes(i.href)).some((i) => active(i.href));

  // Native modal dialog: traps focus, closes on Escape and returns focus to the menu button (WCAG 2.4.3).
  useEffect(() => { ref.current?.close(); }, [path]);
  const show = () => { ref.current?.showModal(); setOpen(true); document.body.style.overflow = "hidden"; };

  return (
    <>
      <nav aria-label="เมนูด่วน" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {items.filter((i) => (tabs as readonly string[]).includes(i.href)).map((i) => {
            const on = active(i.href);
            return (
              <li key={i.href}>
                <Link
                  href={i.href}
                  aria-current={on ? "page" : undefined}
                  className={cx("relative flex flex-col items-center gap-1 py-2.5 text-xs", on ? "font-semibold text-accent" : "font-medium text-muted")}
                >
                  {on && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-brand" />}
                  <i.icon className="size-5" strokeWidth={on ? 2.2 : 1.7} />
                  {i.short}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={show}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={cx("relative flex w-full flex-col items-center gap-1 py-2.5 text-xs", inSheet || open ? "font-semibold text-accent" : "font-medium text-muted")}
            >
              {inSheet && <span aria-hidden className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-brand" />}
              <Menu className="size-5" strokeWidth={1.7} />
              เมนู
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={ref}
        aria-label="เมนูทั้งหมด"
        onClose={() => { setOpen(false); document.body.style.overflow = ""; }}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="surface-dark fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none animate-rise overflow-y-auto rounded-t-3xl bg-ink px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] backdrop:bg-black/50 backdrop:backdrop-blur-sm lg:hidden"
      >
        <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <div className="mb-4 flex items-center gap-3 px-1">
          <span aria-hidden className="grid size-10 place-items-center rounded-full bg-brand text-sm font-semibold text-white uppercase">{name.slice(0, 1)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <button type="button" autoFocus onClick={() => ref.current?.close()} className="rounded-full p-2 text-muted hover:bg-panel-3" aria-label="ปิดเมนู">
            <X className="size-5" />
          </button>
        </div>
        <div className="pl-3"><AppNav area={area} /></div>
        {staff && <AreaSwitch area={area} className="mt-4" />}
        <ThemeToggle label className="mt-3 w-full justify-start" />
        <form action="/auth/signout" method="post" className="mt-4 border-t border-line pt-4">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-panel-3 hover:text-fg">
            <LogOut className="size-4" /> ออกจากระบบ
          </button>
        </form>
      </dialog>
    </>
  );
}
