import { Pencil } from "lucide-react";
import Link from "next/link";
import { CARD, EmptyLine, Section, Status, TextLink } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { cx } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { SalesTabs } from "../_components/sales-tabs";
import { fmtDate } from "@/lib/format";
import { bangkokToday } from "@/lib/promotions";
import type { Promotion } from "@/lib/types";
import { PromotionForm } from "./forms";

export const metadata = { title: "โปรโมชัน" };

export default async function AdminPromotionsPage({ searchParams }: PageProps<"/admin/promotions">) {
  const { edit } = await searchParams;
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("promotions").select("*").order("starts_on", { ascending: false }).limit(60);
  const list = (data ?? []) as Promotion[];
  const today = bangkokToday();
  const editing = typeof edit === "string" ? list.find((p) => p.id === edit) : undefined;
  const state = (p: Promotion) =>
    !p.active ? { tone: "neutral" as const, label: "ปิดอยู่" }
      : p.ends_on < today ? { tone: "neutral" as const, label: "หมดเวลาแล้ว" }
        : p.starts_on > today ? { tone: "warn" as const, label: "รอเริ่ม" }
          : { tone: "good" as const, label: "กำลังแสดง" };
  const running = list.find((p) => state(p).label === "กำลังแสดง");

  return (
    <>
      <PageHeader title="ราคาและโปร" description={running ? `ป้ายที่แสดงบนหน้าแรกตอนนี้: ${running.title}` : "ตอนนี้ยังไม่มีป้ายโปรบนหน้าแรก"} />
      <SalesTabs on="promotions" />
      <div className="space-y-10">
        <section id="editor" className="scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">{editing ? `แก้ไข: ${editing.title}` : "สร้างป้ายโปร"}</h2>
              <p className="mt-0.5 text-sm text-muted">ป้ายนี้เป็นหัวข้อเหนือตารางแพ็กเกจบนหน้าแรก ราคาโปรจริงตั้งที่แท็บ “สินค้า ราคา และโปรจับคู่”</p>
            </div>
            {editing && <TextLink href="/admin/promotions">+ สร้างป้ายใหม่แทน</TextLink>}
          </div>
          <PromotionForm key={editing?.id ?? "new"} item={editing} today={today} />
        </section>

        <Section title="โปรโมชันทั้งหมด" description={`${list.length} รายการ · กดเพื่อแก้ไข`} bare>
          {list.length ? (
            <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {list.map((p) => {
                const st = state(p);
                const current = editing?.id === p.id;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/promotions?edit=${p.id}#editor`}
                      aria-current={current ? "true" : undefined}
                      className={cx(CARD, "group flex h-full items-start gap-4 p-4 transition-colors hover:border-line-strong sm:p-5", current && "border-brand ring-1 ring-brand")}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <Status tone={st.tone}>{st.label}</Status>
                          {current && <Status tone="warn">กำลังแก้ไข</Status>}
                          {p.badge && <span className="truncate text-xs font-semibold text-accent">{p.badge}</span>}
                        </span>
                        <span className="mt-2 block truncate font-bold">{p.title}</span>
                        <span className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted">
                          <span className="num">{fmtDate(p.starts_on)} – {fmtDate(p.ends_on)}</span>
                          {p.code && <span className="num font-semibold">โค้ด {p.code}</span>}
                        </span>
                      </span>
                      <span className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium group-hover:border-fg">
                        <Pencil aria-hidden className="size-3.5" /> แก้ไข
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : <div className={CARD}><EmptyLine>ยังไม่มีโปรโมชัน สร้างป้ายแรกด้านบน</EmptyLine></div>}
        </Section>
      </div>
    </>
  );
}
