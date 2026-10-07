import Link from "next/link";
import { ArrowRight, BadgePercent, CheckCircle2, KeyRound, Receipt, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatRow } from "@/components/app/kit";
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

/** Back-office home: four big buttons, what needs doing today, and three numbers. */
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

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">สวัสดี {name}</h1>
        <p className="mt-1 text-base text-muted">{waiting ? `วันนี้มีเรื่องรอคุณ ${waiting} รายการ` : "วันนี้ไม่มีงานค้าง เรียบร้อยดี"}</p>
      </header>

      <nav aria-label="ทำอะไรดี" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="group flex min-h-24 items-center gap-4 rounded-xl border border-line bg-panel p-5 transition-colors hover:border-brand/60 focus-visible:border-brand">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-dim text-accent"><a.icon aria-hidden className="size-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{a.title}</span>
              <span className="block text-sm text-muted">{a.line}</span>
            </span>
            <ArrowRight aria-hidden className="size-5 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
          </Link>
        ))}
      </nav>

      <section aria-labelledby="todo-title">
        <h2 id="todo-title" className="text-lg font-semibold">งานวันนี้</h2>
        {todo.length ? (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {todo.map((g) => (
              <li key={g.id} className="flex flex-col rounded-xl border border-line bg-panel">
                <div className="flex items-center justify-between gap-3 px-5 pt-4">
                  <h3 className="font-semibold">{g.title}</h3>
                  <span className="num grid min-w-8 place-items-center rounded-full bg-brand px-2 py-0.5 text-sm font-bold text-white">{g.items.length}</span>
                </div>
                <ul className="mt-2 flex-1 divide-y divide-line px-5">
                  {g.items.slice(0, 3).map((i) => (
                    <li key={i.key} className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 py-2 text-sm">
                      <Link href={i.href} className="min-w-0 flex-1 truncate hover:text-accent hover:underline">{i.title}</Link>
                      <span className="num shrink-0 text-muted">{i.meta}</span>
                    </li>
                  ))}
                  {g.items.length > 3 && <li className="py-2 text-sm text-muted">และอีก {g.items.length - 3} รายการ</li>}
                </ul>
                <div className="px-5 pt-1 pb-4">
                  <Link href={g.href} className="inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-strong">
                    {g.action} <ArrowRight aria-hidden className="size-4" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-panel px-5 py-5 text-sm">
            <CheckCircle2 aria-hidden className="size-5 text-buy" /> ไม่มีงานค้าง ทุกอย่างเรียบร้อย
          </p>
        )}
      </section>

      <section aria-labelledby="numbers-title">
        <h2 id="numbers-title" className="mb-4 text-lg font-semibold">ตัวเลขสำคัญ</h2>
        <StatRow
          items={[
            { label: "ยอดขาย 30 วัน", value: fmtTHB(revenue), hint: `${paidRows.length} คำสั่งซื้อ` },
            { label: "ลูกค้าทั้งหมด", value: members.count ?? 0, hint: "คน" },
            { label: "ลูกค้าใหม่ 7 วัน", value: newMembers.count ?? 0, hint: "คน" },
          ]}
        />
      </section>
    </div>
  );
}
