import { Notice } from "@/components/ui";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { AddAdmin, RemoveAdmin } from "./forms";

export const metadata = { title: "ทีมงาน" };

export default async function TeamPage() {
  const { supabase, profile: me } = await requireStaff();
  const { data } = await supabase.from("profiles").select("*").in("role", ["owner", "admin"]).order("role", { ascending: false }).order("created_at");
  const team = (data ?? []) as Profile[];
  const isOwner = me.role === "owner";

  return (
    <>
      <PageHeader title="ทีมงาน" description="คนที่เข้าหลังบ้านได้ ค้นหาชื่อแล้วกด “ทำเป็นแอดมิน” ได้เลย" />
      <div className="max-w-3xl space-y-10">
        <section aria-labelledby="add-title" className="rounded-xl border border-line bg-panel-2 p-5">
          <h2 id="add-title" className="mb-4 text-lg font-semibold">เพิ่มแอดมิน</h2>
          {isOwner ? <AddAdmin /> : <Notice>เฉพาะเจ้าของระบบเท่านั้นที่เพิ่มหรือถอดทีมงานได้</Notice>}
        </section>

        <section aria-labelledby="team-title">
          <h2 id="team-title" className="mb-3 text-lg font-semibold">ทีมงานตอนนี้ <span className="num text-base font-normal text-muted">({team.length} คน)</span></h2>
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
            {team.map((p) => {
              const name = p.display_name || p.email.split("@")[0];
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-dim text-sm font-semibold text-accent">{name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name}{p.id === me.id && <span className="text-muted"> (คุณ)</span>}</span>
                    <span className="block truncate text-sm text-muted">{p.email} · {ROLE_LABEL[p.role]}</span>
                  </span>
                  {isOwner && p.role === "admin" && <RemoveAdmin userId={p.id} name={name} />}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-sm text-muted">เจ้าของระบบทำได้ทุกอย่าง · แอดมินจัดการลูกค้า สิทธิ์ และคำขอได้ แต่เพิ่มหรือถอดทีมงานไม่ได้</p>
        </section>
      </div>
    </>
  );
}
