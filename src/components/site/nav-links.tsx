"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const item = "inline-flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors";

/** Desktop links inside the pill navbar. */
export function SiteNavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  const cls = (on: boolean) => cx(item, on ? "bg-panel-3 text-fg" : "text-muted hover:text-fg");
  return (
    <nav aria-label="เมนูหลัก" className="hidden items-center gap-0.5 lg:flex">
      <Link href="/" aria-current={path === "/" ? "page" : undefined} className={cls(path === "/")}>หน้าแรก</Link>
      {links.map((n) =>
        n.href.includes("#") ? (
          <a key={n.href} href={n.href} className={cls(false)}>{n.label}</a>
        ) : (
          <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined} className={cls(path === n.href)}>{n.label}</Link>
        ),
      )}
    </nav>
  );
}
