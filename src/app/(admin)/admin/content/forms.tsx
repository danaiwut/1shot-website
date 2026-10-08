"use client";
import { useActionState, useState, useTransition } from "react";
import { ExternalLink } from "lucide-react";
import { FormLayout, Panel, Step, SubmitButton } from "@/components/app/form-kit";
import { Button, cx, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { addNews, deleteBrief, deleteNews, saveBrief } from "./actions";

const area = "field-sizing-fixed bg-panel text-sm placeholder:text-faint focus-visible:border-brand/70";
const thaiDay = (day: string) => (day ? new Date(`${day}T00:00:00+07:00`).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Bangkok" }) : "—");
const thaiTime = (local: string) => (local ? new Date(`${local}:00+07:00`).toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" }) : "—");
const impactTone = (t: string) => (t.startsWith("หนุน") ? "text-buy" : t.startsWith("กดดัน") ? "text-sell" : "text-muted");

/** Morning brief: date + story + facts on the left, the card members see on /news on the right. */
export function BriefForm({ today, brief }: { today: string; brief?: { brief_date: string; story: string; facts: string } }) {
  const [state, action, pending] = useActionState(saveBrief, {});
  const [date, setDate] = useState(brief?.brief_date ?? today);
  const [story, setStory] = useState(brief?.story ?? "");
  const [facts, setFacts] = useState(brief?.facts ?? "");
  const chars = story.trim() ? story.trim().length : 0;
  return (
    <form action={action}>
      <FormLayout aside={<>
        <Panel title="ตัวอย่างที่สมาชิกเห็น">
          <div className="overflow-hidden rounded-xl border border-line bg-panel-2">
            <div className="border-b border-line px-4 py-3">
              <p className="font-bold">สรุปเช้า</p>
              <p className="text-xs text-muted">{thaiDay(date)}</p>
            </div>
            <div className="max-h-[22rem] space-y-3 overflow-y-auto px-4 py-4">
              <p className="text-sm leading-relaxed whitespace-pre-line">{story || <span className="text-faint">สรุปภาวะตลาดทองคำจะแสดงตรงนี้</span>}</p>
              {facts && (
                <details open className="border-t border-line pt-1">
                  <summary className="flex min-h-9 cursor-pointer items-center text-sm font-medium text-muted">ข้อเท็จจริงที่ใช้สรุป</summary>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-muted">{facts}</p>
                </details>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">แสดงในหน้า “ข่าวและสรุปตลาด” และแดชบอร์ดสมาชิก</p>
        </Panel>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <SubmitButton pending={pending}>{brief ? "บันทึกการแก้ไข" : "เผยแพร่สรุปเช้า"}</SubmitButton>
        {brief && <div className="text-center"><DeleteBrief date={brief.brief_date} long /></div>}
      </>}>
        <Step n={1} title="สรุปเช้า" aside={<span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold text-muted tabular-nums">{chars.toLocaleString()} / 6,000 ตัวอักษร</span>}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <Field label="วันที่" required hint="มีสรุปวันนั้นอยู่แล้ว = บันทึกทับ">
                <Input name="brief_date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
            </div>
            <Field label="สรุป" required>
              <Textarea name="story" required rows={10} maxLength={6000} value={story} onChange={(e) => setStory(e.target.value)} className={area}
                placeholder={"ทองคำเปิดตลาดเช้านี้ที่ 2,385 ดอลลาร์ ปรับขึ้นจากเมื่อวาน หลังตัวเลขเงินเฟ้อสหรัฐออกมาต่ำกว่าคาด…"} />
            </Field>
          </div>
        </Step>
        <Step n={2} title="ข้อเท็จจริงที่ใช้สรุป" hint="ไม่บังคับ · สมาชิกกดเปิดดูได้ใต้สรุป">
          <Textarea name="facts" rows={5} maxLength={6000} value={facts} onChange={(e) => setFacts(e.target.value)} className={area}
            placeholder={"CPI สหรัฐ ก.ย. +2.4% (คาด 2.6%)\nDXY 101.8 (-0.3%)\nUS10Y 3.95%"} />
        </Step>
      </FormLayout>
    </form>
  );
}

/** World news item: what it is, where it came from, what it means for gold — preview as a /news row. */
export function NewsForm({ now }: { now: string }) {
  const [state, action, pending] = useActionState(addNews, {});
  const init = { title: "", title_th: "", link: "", source: "", gold_impact: "", published_at: now };
  const [v, setV] = useState(init);
  const on = (k: keyof typeof init) => ({ value: v[k], onChange: (e: { target: { value: string } }) => setV((c) => ({ ...c, [k]: e.target.value })) });
  const [seen, setSeen] = useState(state); // clear after a successful add
  if (seen !== state) { setSeen(state); if (state.ok) setV(init); }
  const impact = (prefix: string) => setV((c) => ({ ...c, gold_impact: prefix + c.gold_impact.replace(/^(หนุน|กดดัน)\S*\s?/, "") }));

  return (
    <form action={action}>
      <FormLayout aside={<>
        <Panel title="ตัวอย่างในหน้าข่าว">
          <div className="rounded-xl border border-line bg-panel-2 px-4 py-3.5">
            <p className="flex items-start gap-2 text-sm font-medium">
              <span className="min-w-0 flex-1">{v.title_th || v.title || <span className="text-faint">หัวข้อข่าว</span>}</span>
              <ExternalLink aria-hidden className="mt-0.5 size-3.5 shrink-0 text-faint" />
            </p>
            {v.gold_impact && <p className={cx("mt-1 text-sm leading-relaxed", impactTone(v.gold_impact))}>{v.gold_impact}</p>}
            <p className="mt-1 text-xs text-muted">{v.source || "แหล่งข่าว"} · <span className="num">{thaiTime(v.published_at)}</span></p>
          </div>
        </Panel>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <SubmitButton pending={pending} pendingText="กำลังเพิ่ม…">เพิ่มข่าว</SubmitButton>
      </>}>
        <Step n={1} title="หัวข้อข่าว">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="หัวข้อ (ต้นฉบับ)" required><Input name="title" required maxLength={300} {...on("title")} placeholder="Fed holds rates steady, signals two cuts next year" /></Field>
            <Field label="หัวข้อภาษาไทย" hint="ถ้ามี จะแสดงแทนต้นฉบับ"><Input name="title_th" maxLength={300} {...on("title_th")} placeholder="เฟดคงดอกเบี้ย ส่งสัญญาณลด 2 ครั้งปีหน้า" /></Field>
          </div>
        </Step>
        <Step n={2} title="ที่มา">
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <Field label="ลิงก์" required><Input name="link" type="url" required {...on("link")} placeholder="https://www.reuters.com/…" /></Field>
            <Field label="แหล่งข่าว" required><Input name="source" required maxLength={80} {...on("source")} placeholder="Reuters" /></Field>
            <Field label="เวลาเผยแพร่ (เวลาไทย)" required><Input name="published_at" type="datetime-local" required {...on("published_at")} /></Field>
          </div>
        </Step>
        <Step n={3} title="ผลต่อทองคำ" hint="ขึ้นต้นด้วย “หนุน…” = สีเขียว · “กดดัน…” = สีแดง">
          <div className="mb-3 flex flex-wrap gap-2">
            {[["หนุน", "หนุนทองคำ ", "border-buy/40 text-buy"], ["กดดัน", "กดดันทองคำ ", "border-sell/40 text-sell"]].map(([label, prefix, tone]) => (
              <button key={label} type="button" onClick={() => impact(prefix)} className={cx("min-h-9 rounded-full border px-3.5 text-sm font-semibold hover:bg-panel-2", tone)}>{label}…</button>
            ))}
          </div>
          <Field label="ผลต่อทองคำ"><Input name="gold_impact" maxLength={500} {...on("gold_impact")} placeholder="หนุนทองคำ ดอลลาร์อ่อนค่าหลังเฟดส่งสัญญาณลดดอกเบี้ย" /></Field>
        </Step>
      </FormLayout>
    </form>
  );
}

export function DeleteNews({ id, title }: { id: number; title: string }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="shrink-0 text-sell hover:text-sell" aria-label={`ลบข่าว ${title}`} disabled={busy}
      onClick={() => confirm(`ลบข่าว “${title}”?`) && start(() => deleteNews(id))}>
      ลบ
    </Button>
  );
}

export function DeleteBrief({ date, long }: { date: string; long?: boolean }) {
  const [busy, start] = useTransition();
  return (
    <Button type="button" variant="ghost" className="text-sell hover:text-sell" aria-label={`ลบสรุปวันที่ ${date}`} disabled={busy}
      onClick={() => confirm(`ลบสรุปวันที่ ${date}?`) && start(() => deleteBrief(date))}>
      {long ? "ลบสรุปนี้" : "ลบ"}
    </Button>
  );
}
