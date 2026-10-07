import Link from "next/link";
import { Row, Rows, Section, SettingsSection } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Badge, Notice } from "@/components/ui";
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
      <PageHeader title="ทีมงาน" description="ผู้ที่เข้าระบบหลังบ้านได้ แอดมินจัดการสมาชิก สิทธิ์ และคำขอได้ ส่วนการเพิ่มหรือถอดทีมงานทำได้เฉพาะเจ้าของระบบ" />
      <div className="space-y-10">
        <Section title="สมาชิกทีม" description={`${team.length} คน`}>
          <Rows>
            {team.map((p) => (
              <Row key={p.id} className="block">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link href={`/admin/members/${p.id}`} className="inline-flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:text-accent hover:underline">{p.display_name || p.email}</Link>
                  <Badge>{ROLE_LABEL[p.role]}</Badge>
                  {p.id === me.id && <Badge>คุณ</Badge>}
                </div>
                <p className="text-sm break-all text-muted">{p.email} · เข้าร่วม {fmtDate(p.created_at)}</p>
                {isOwner && p.role === "admin" && <RemoveAdminForm email={p.email} />}
              </Row>
            ))}
          </Rows>
        </Section>
        <div>
          <SettingsSection title="เพิ่มแอดมิน" description="ให้สิทธิ์เข้าระบบหลังบ้านกับบัญชีที่สมัครแล้ว">
            {isOwner ? <AddAdminForm /> : <Notice>เฉพาะเจ้าของระบบเท่านั้นที่เพิ่มหรือถอดทีมงานได้</Notice>}
          </SettingsSection>
        </div>
      </div>
    </>
  );
}
