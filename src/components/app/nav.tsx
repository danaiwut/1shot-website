"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, LayoutDashboard, Newspaper, Settings2, ShieldHalf, Webhook, Users, SlidersHorizontal } from "lucide-react";
import { cx } from "@/components/ui";

const MEMBER = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/signals", label: "สัญญาณ", icon: Activity },
  { href: "/news", label: "ข่าวและสรุปตลาด", icon: Newspaper },
  { href: "/account", label: "บัญชีของฉัน", icon: Settings2 },
];
const STAFF = [
  { href: "/admin", label: "สมาชิก", icon: Users },
  { href: "/admin/indicators", label: "อินดิเคเตอร์และห้อง", icon: SlidersHorizontal },
  { href: "/admin/webhooks", label: "Webhook log", icon: Webhook },
];

export function AppNav({ staff }: { staff: boolean }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" || path.startsWith("/admin/members") : path === href || path.startsWith(`${href}/`));
  const item = (i: (typeof MEMBER)[number]) => (
    <Link
      key={i.href}
      href={i.href}
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

export function MobileNav({ staff }: { staff: boolean }) {
  const path = usePathname();
  const items = [...MEMBER, ...(staff ? STAFF.slice(0, 1) : [])];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-panel/95 backdrop-blur-xl lg:hidden" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((i) => {
        const on = path === i.href || path.startsWith(`${i.href}/`);
        return (
          <Link key={i.href} href={i.href} className={cx("flex flex-col items-center gap-1 py-2.5 text-[10px]", on ? "text-accent" : "text-muted")}>
            <i.icon className="size-5" strokeWidth={1.7} />
            {i.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
