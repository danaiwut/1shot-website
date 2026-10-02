"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/ui";

const underline = "relative text-fg after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-brand";

export function SiteNavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="hidden items-center gap-7 text-sm text-muted lg:flex">
      <Link href="/" className={cx("py-1 transition-colors hover:text-fg", path === "/" && underline)}>หน้าแรก</Link>
      {links.map((n) =>
        n.href.includes("#") ? (
          <a key={n.href} href={n.href} className="py-1 transition-colors hover:text-fg">{n.label}</a>
        ) : (
          <Link key={n.href} href={n.href} className={cx("py-1 transition-colors hover:text-fg", path === n.href && underline)}>{n.label}</Link>
        ),
      )}
    </nav>
  );
}
