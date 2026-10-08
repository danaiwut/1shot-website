import { Crown, ShieldCheck } from "lucide-react";
import { CARD, Rows, Row, Section, StatRow, Status } from "@/components/app/kit";
import { cx, Notice } from "@/components/ui";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { AddAdmin, RemoveAdmin } from "./forms";

export const metadata = { title: "ทีมงาน" };

export default async function TeamPage() {
  const { supabase, profile: me } = await requireStaff();
  const { data } = await supabase.from("profiles").select("*").in("role", ["owner", "admin"]).order("role", { ascending: false }).order("created_at");
  const team = (data ?? []) as Profile[];
  const isOwner = me.role === "owner";
  const owners = team.filter((p) => p.role === "owner").length;

  return (
    <>
      <PageHeader title="ทีมงาน" description="คนที่เข้าหลังบ้านได้ ค้นหาชื่อแล้วกด “ทำเป็นแอดมิน” ได้เลย" />
      <div className="space-y-8">
        <StatRow items={[
          { label: "ทีมงานทั้งหมด", value: team.length },
          { label: "เจ้าของ", value: owners, hint: "ทำได้ทุกอย่าง" },
          { label: "แอดมิน", value: team.length - owners, hint: "จัดการลูกค้า สิทธิ์ และคำขอ" },
        ]} />

        <div className="grid items-start gap-8 xl:grid-cols-2">
          <Section title={<>ทีมงานตอนนี้ <span className="num ml-1 text-sm font-normal text-muted tabular-nums">{team.length} คน</span></>} description="แอดมินเพิ่มหรือถอดทีมงานไม่ได้ เฉพาะเจ้าของเท่านั้น">
            <Rows>
              {team.map((p) => {
                const name = p.display_name || p.email.split("@")[0];
                const owner = p.role === "owner";
                return (
                  <Row key={p.id} className="flex-wrap gap-x-4 gap-y-2">
                    <span aria-hidden className={cx("grid size-11 shrink-0 place-items-center rounded-full text-sm font-bold", owner ? "bg-brand text-white" : "bg-brand-dim text-accent")}>{name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{name}{p.id === me.id && <span className="font-normal text-muted"> (คุณ)</span>}</span>
                      <span className="block truncate text-sm text-muted">{p.email} · เข้าร่วม {fmtDate(p.created_at)}</span>
                    </span>
                    <Status tone={owner ? "warn" : "good"}>
                      {owner ? <Crown aria-hidden className="size-3.5" /> : <ShieldCheck aria-hidden className="size-3.5" />}{ROLE_LABEL[p.role]}
                    </Status>
                    {isOwner && p.role === "admin" && <RemoveAdmin userId={p.id} name={name} />}
                  </Row>
                );
              })}
            </Rows>
          </Section>

          <section aria-labelledby="add-title" className={cx(CARD, "overflow-visible p-5 sm:p-6")}>
            <div className="mb-4 flex items-center gap-3">
              <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">+</span>
              <h2 id="add-title" className="text-lg font-bold tracking-tight">เพิ่มแอดมิน</h2>
            </div>
            {isOwner ? <AddAdmin /> : <Notice>เฉพาะเจ้าของระบบเท่านั้นที่เพิ่มหรือถอดทีมงานได้</Notice>}
          </section>
        </div>
      </div>
    </>
  );
}
