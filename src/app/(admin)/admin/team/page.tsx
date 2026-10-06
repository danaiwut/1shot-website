import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Card, CardHeader, Notice } from "@/components/ui";
import { requireStaff } from "@/lib/auth";
import { fmtDate, ROLE_LABEL } from "@/lib/format";
import type { Profile } from "@/lib/types";
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
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader title="สมาชิกทีม" hint={`${team.length} คน`} />
          <ul className="divide-y divide-line">
            {team.map((p) => (
              <li key={p.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/members/${p.id}`} className="font-semibold underline-offset-4 hover:underline">{p.display_name || p.email}</Link>
                  <Badge tone={p.role === "owner" ? "brand" : "info"}>{ROLE_LABEL[p.role]}</Badge>
                  {p.id === me.id && <Badge>คุณ</Badge>}
                </div>
                <p className="text-sm text-muted">{p.email} · เข้าร่วม {fmtDate(p.created_at)}</p>
                {isOwner && p.role === "admin" && <RemoveAdminForm email={p.email} />}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="self-start p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">เพิ่มแอดมิน</h2>
          {isOwner ? <AddAdminForm /> : <Notice>เฉพาะเจ้าของระบบเท่านั้นที่เพิ่มหรือถอดทีมงานได้</Notice>}
        </Card>
      </div>
    </>
  );
}
