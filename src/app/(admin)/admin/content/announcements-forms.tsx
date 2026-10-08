"use client";
import { useActionState, useState, useTransition } from "react";
import { FormLayout, Panel, Step, SubmitButton, Switch } from "@/components/app/form-kit";
import { Badge, Button, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import type { Announcement } from "@/lib/types";
import { deleteAnnouncement, saveAnnouncement, type AnnState } from "./announcements-actions";

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";
const thaiDay = (iso?: string) => (iso ? new Date(iso) : new Date()).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" });

/** Write / edit an announcement: title + body on the left, the post as members see it plus publish switches on the right. */
export function AnnouncementForm({ item }: { item?: Announcement }) {
  const [state, action, pending] = useActionState<AnnState, FormData>(saveAnnouncement, {});
  const init = { title: item?.title ?? "", body: item?.body ?? "", published: item?.published ?? true, pinned: item?.pinned ?? false };
  const [v, setV] = useState(init);
  const set = <K extends keyof typeof init>(k: K) => (x: (typeof init)[K]) => setV((c) => ({ ...c, [k]: x }));
  const [seen, setSeen] = useState(state); // clear after a successful post
  if (seen !== state) { setSeen(state); if (state.ok && !item) setV(init); }

  return (
    <form action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormLayout aside={<>
        <Panel title="ตัวอย่างที่สมาชิกเห็น">
          <article className="rounded-xl border border-line bg-panel-2 px-4 py-5">
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
              {v.pinned && <Badge>ปักหมุด</Badge>}
              <span className="num">{thaiDay(item?.created_at)}</span>
            </p>
            <p className="mt-1.5 text-base font-semibold">{v.title || <span className="text-faint">หัวข้อประกาศ</span>}</p>
            {v.body && <p className="mt-2 max-h-72 overflow-y-auto text-sm leading-relaxed whitespace-pre-line">{v.body}</p>}
          </article>
          {!v.published && <p className="mt-3 rounded-lg bg-panel-3 px-3 py-2 text-center text-xs font-semibold text-muted">ซ่อนอยู่ สมาชิกยังไม่เห็น</p>}
        </Panel>
        <div className="space-y-1 rounded-2xl border border-line bg-panel p-2 shadow-[0_20px_60px_-40px_rgb(0_0_0/0.35)]">
          <Switch name="published" label="เผยแพร่" hint="สมาชิกเห็นในเมนู ประกาศ ทันที" checked={v.published} onChange={set("published")} />
          <Switch name="pinned" label="ปักหมุด" hint="อยู่บนสุดของรายการ" checked={v.pinned} onChange={set("pinned")} />
        </div>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <SubmitButton pending={pending}>{item ? "บันทึกการแก้ไข" : v.published ? "โพสต์ประกาศ" : "บันทึกแบบร่าง"}</SubmitButton>
        {item && <div className="text-center"><DeleteButton id={item.id} title={item.title} /></div>}
      </>}>
        <Step n={1} title="หัวข้อ">
          <Field label="หัวข้อ" required><Input name="title" required maxLength={160} value={v.title} onChange={(e) => set("title")(e.target.value)} placeholder="เช่น ปิดปรับปรุงระบบ คืนวันเสาร์ 22:00–23:00 น." /></Field>
        </Step>
        <Step n={2} title="เนื้อหา" hint="ขึ้นบรรทัดใหม่ได้ตามต้องการ แสดงตามที่พิมพ์">
          <Textarea name="body" aria-label="เนื้อหา" rows={item ? 8 : 10} maxLength={8000} value={v.body} onChange={(e) => set("body")(e.target.value)} className={area}
            placeholder={"ระหว่างนี้อินดิเคเตอร์ยังใช้งานได้ตามปกติ\nแต่จะเข้าหน้าบัญชีและต่ออายุไม่ได้ชั่วคราว"} />
        </Step>
      </FormLayout>
    </form>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" disabled={busy} aria-label={`ลบประกาศ ${title}`} onClick={() => confirm(`ลบประกาศ “${title}”?`) && start(() => deleteAnnouncement(id))}>
      ลบประกาศนี้
    </Button>
  );
}
