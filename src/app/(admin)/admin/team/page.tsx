import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { Panel } from "../_components/admin-ui";
import { AddAdminForm, RemoveAdminForm } from "./forms";

export const metadata = { title: "ทีมงาน" };

export default async function TeamPage() {
  const { supabase, profile: me } = await requireStaff();
  const { data } = await supabase.from("profiles").select("*").in("role", ["owner", "admin"]).order("role", { ascending: false }).order("created_at");
  const team = (data ?? []) as Profile[];
  const isOwner = me.role === "owner";

  return (
    <>
      <PageHeader eyebrow="ระบบหลังบ้าน" title="ทีมงาน" description="ผู้ที่เข้าระบบหลังบ้านได้ แอดมินจัดการสมาชิก สิทธิ์ และคำขอได้ ส่วนการเพิ่มหรือถอดทีมงานทำได้เฉพาะเจ้าของระบบ" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Panel title="สมาชิกทีม" description={`${team.length} คน`}>
          <ul className="divide-y divide-line">
            {team.map((p) => (
              <li key={p.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-dim text-sm font-semibold text-accent uppercase">
                    {(p.display_name || p.email).slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/members/${p.id}`} className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:text-accent hover:underline">{p.display_name || p.email}</Link>
                      <Badge tone={p.role === "owner" ? "brand" : "info"}>{ROLE_LABEL[p.role]}</Badge>
                      {p.id === me.id && <Badge>คุณ</Badge>}
                    </div>
                    <p className="text-sm break-all text-muted">{p.email} · เข้าร่วม {fmtDate(p.created_at)}</p>
                    {isOwner && p.role === "admin" && <RemoveAdminForm email={p.email} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel className="self-start" title="เพิ่มแอดมิน" description="ให้สิทธิ์เข้าระบบหลังบ้านกับบัญชีที่สมัครแล้ว">
          <div className="p-4 sm:p-6">
            {isOwner ? <AddAdminForm /> : <Notice>เฉพาะเจ้าของระบบเท่านั้นที่เพิ่มหรือถอดทีมงานได้</Notice>}
          </div>
        </Panel>
      </div>
    </>
  );
}
