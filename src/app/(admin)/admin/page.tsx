import Link from "next/link";
import { ArrowRight, BadgePercent, CheckCircle2, KeyRound, Receipt, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CARD } from "@/components/app/kit";
import { DarkPanel, Dot, SectionHeading, track } from "@/components/brand";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtTHB } from "@/lib/store/pricing";
import { loadTodo } from "./_components/todo";

export const metadata = { title: "หน้าแรก" };

const DAY = 864e5;

const ACTIONS: { href: string; title: string; line: string; icon: LucideIcon }[] = [
  { href: "/admin/rights", title: "ให้สิทธิ์ลูกค้า", line: "เปิดอินดิเคเตอร์ให้ลูกค้า", icon: KeyRound },
  { href: "/admin/members", title: "หาลูกค้า", line: "ค้นด้วยอีเมล ชื่อ หรือเลขบัญชี", icon: Search },
  { href: "/admin/products", title: "ราคาและโปร", line: "ตั้งราคา จับคู่ ลดราคา", icon: BadgePercent },
  { href: "/admin/orders", title: "ยอดขาย", line: "ใครซื้ออะไร เงินเข้าเท่าไร", icon: Receipt },
];

/** Back-office home: greeting with three numbers, four big buttons, and what needs doing today. */
export default async function AdminHomePage() {
  const { supabase, profile } = await requireStaff();
  const now = Date.now();
  const d30 = new Date(now - 30 * DAY).toISOString();
  const d7 = new Date(now - 7 * DAY).toISOString();

  const [todo, paid, members, newMembers] = await Promise.all([
    loadTodo(supabase),
    supabase.from("orders").select("amount_satang").eq("status", "paid").gte("paid_at", d30),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7),
  ]);
  const paidRows = (paid.data ?? []) as { amount_satang: number }[];
  const revenue = paidRows.reduce((s, o) => s + o.amount_satang, 0);
  const waiting = todo.reduce((n, g) => n + g.items.length, 0);
  const name = profile.display_name || profile.email.split("@")[0];

  const today = new Intl.DateTimeFormat("th-TH", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Bangkok" }).format(new Date());

  return (
    <div className="space-y-12">
      <DarkPanel as="header" className="px-6 py-10 sm:px-10 sm:py-12">
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className={cx("text-sm font-bold text-accent", track(today, "tracking-[0.18em]"))}>{today}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">สวัสดี {name}<Dot /></h1>
            <p className="mt-3 text-base text-muted sm:text-lg">{waiting ? `วันนี้มีเรื่องรอคุณ ${waiting} รายการ` : "วันนี้ไม่มีงานค้าง เรียบร้อยดี"}</p>
          </div>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {[
              { k: "ยอดขาย 30 วัน", v: fmtTHB(revenue) },
              { k: "ลูกค้าทั้งหมด", v: members.count ?? 0 },
              { k: "ใหม่ 7 วัน", v: newMembers.count ?? 0 },
            ].map((x) => (
              <div key={x.k} className="bg-panel/80 px-4 py-3 backdrop-blur sm:px-5">
                <dt className="text-xs font-semibold text-muted">{x.k}</dt>
                <dd className="mt-1 text-xl font-black tracking-tight tabular-nums sm:text-2xl">{x.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </DarkPanel>

      <nav aria-label="ทำอะไรดี" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="group flex flex-col gap-5 rounded-2xl border border-line bg-panel p-5 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)] transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand/50 focus-visible:border-brand">
            <span className="flex items-center justify-between">
              <span className="grid size-12 place-items-center rounded-xl bg-brand text-white shadow-[0_10px_30px_-10px_rgb(178_0_22/0.7)]"><a.icon aria-hidden className="size-6" /></span>
              <ArrowRight aria-hidden className="size-5 text-faint transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </span>
            <span>
              <span className="block text-lg font-bold">{a.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{a.line}</span>
            </span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="todo-title">
        <SectionHeading id="todo-title" eyebrow="To-do" title="งานวันนี้" size="sm" />
        {todo.length ? (
          <ul className="mt-6 grid gap-4 lg:grid-cols-2">
            {todo.map((g) => (
              <li key={g.id} className={cx(CARD, "flex flex-col")}>
                <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
                  <h3 className="font-bold">{g.title}</h3>
                  <span className="grid min-w-8 place-items-center rounded-full bg-brand px-2.5 py-0.5 text-sm font-bold text-white tabular-nums">{g.items.length}</span>
                </div>
                <ul className="flex-1 divide-y divide-line px-6">
                  {g.items.slice(0, 3).map((i) => (
                    <li key={i.key} className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 py-2 text-sm">
                      <Link href={i.href} className="min-w-0 flex-1 truncate font-medium hover:text-accent hover:underline">{i.title}</Link>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{i.meta}</span>
                    </li>
                  ))}
                  {g.items.length > 3 && <li className="py-2 text-sm text-muted">และอีก {g.items.length - 3} รายการ</li>}
                </ul>
                <div className="px-6 pt-2 pb-5">
                  <Link href={g.href} className="inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-white">
                    {g.action} <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={cx(CARD, "mt-6 flex items-center gap-3 px-6 py-6 text-sm")}>
            <CheckCircle2 aria-hidden className="size-5 text-buy" /> ไม่มีงานค้าง ทุกอย่างเรียบร้อย
          </p>
        )}
      </section>
    </div>
  );
}
