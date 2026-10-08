"use client";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Check, Search, UserPlus } from "lucide-react";
import { Button, cx, Notice } from "@/components/ui";
import { searchMembers, setTeamRole, type MemberHit, type TeamState } from "./actions";

/** Type to find a member, then one click to make them an admin (with a confirm step). */
export function AddAdmin() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<MemberHit[] | null>(null);
  const [loading, startSearch] = useTransition();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [result, setResult] = useState<TeamState>({});
  const [saving, startSave] = useTransition();
  const seq = useRef(0);
  const listId = useId();

  useEffect(() => {
    const n = ++seq.current;
    const t = setTimeout(() => startSearch(async () => {
      const r = await searchMembers(q);
      if (n === seq.current) setHits(r); // ignore answers to older keystrokes
    }), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q]);

  const make = (m: MemberHit) => startSave(async () => {
    const r = await setTeamRole(m.id, "admin");
    setResult(r);
    setConfirm(null);
    if (r.ok) setHits((h) => h?.filter((x) => x.id !== m.id) ?? null);
  });

  return (
    <div className="space-y-4">
      <label htmlFor="team-q" className="block text-sm font-medium">ค้นหาสมาชิกที่จะให้เข้าหลังบ้าน</label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input
          id="team-q" type="search" value={q} onChange={(e) => { setQ(e.target.value); setResult({}); }}
          placeholder="เช่น somchai@gmail.com หรือ somchai_fx" autoComplete="off" aria-controls={listId}
          className="h-12 w-full rounded-full border border-line-strong bg-panel pr-4 pl-12 text-base outline-none placeholder:text-faint focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>
      {result.error && <Notice tone="error">{result.error}</Notice>}
      {result.ok && <Notice tone="success">{result.ok}</Notice>}

      <div id={listId} aria-live="polite" aria-busy={loading}>
        <p className="mb-2 text-xs font-bold text-muted">{loading && !hits ? "กำลังค้นหา…" : q ? `ผลการค้นหา “${q}”` : "สมาชิกล่าสุด"}</p>
        {hits && hits.length === 0 ? (
          <p className="rounded-xl border border-line bg-panel-2 px-4 py-4 text-sm text-muted">ไม่พบสมาชิกนี้ ให้เขาสมัครสมาชิกที่หน้าเว็บก่อน แล้วค่อยกลับมาเพิ่ม</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel-2">
            {(hits ?? []).map((m) => (
              <li key={m.id} className={cx("flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3", confirm === m.id && "bg-brand-dim")}>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-3 text-sm font-semibold">{m.name.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{m.name}</span>
                  <span className="block truncate text-sm text-muted">{m.email}{m.tradingview && <> · TV <span className="num">{m.tradingview}</span></>}</span>
                </span>
                {confirm === m.id ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm">ให้ {m.name} เข้าหลังบ้านได้?</span>
                    <Button type="button" disabled={saving} onClick={() => make(m)}><Check aria-hidden className="size-4" />{saving ? "กำลังบันทึก…" : "ยืนยัน"}</Button>
                    <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>ยกเลิก</Button>
                  </span>
                ) : (
                  <Button type="button" variant="outline" onClick={() => { setConfirm(m.id); setResult({}); }} aria-label={`ทำ ${m.name} เป็นแอดมิน`}>
                    <UserPlus aria-hidden className="size-4" />ทำเป็นแอดมิน
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Two-step remove: "ถอดออก" → "ยืนยันถอด". */
export function RemoveAdmin({ userId, name }: { userId: string; name: string }) {
  const [ask, setAsk] = useState(false);
  const [state, setState] = useState<TeamState>({});
  const [busy, start] = useTransition();
  if (!ask) return <Button type="button" variant="ghost" className="text-sell hover:text-sell" onClick={() => setAsk(true)} aria-label={`ถอด ${name} ออกจากทีมงาน`}>ถอดออก</Button>;
  return (
    <span className="flex flex-wrap items-center gap-2">
      <span className="text-sm">ถอด {name} ออก?</span>
      <Button type="button" variant="danger" disabled={busy} onClick={() => start(async () => setState(await setTeamRole(userId, "member")))}>{busy ? "กำลังถอด…" : "ยืนยันถอด"}</Button>
      <Button type="button" variant="ghost" onClick={() => setAsk(false)}>ยกเลิก</Button>
      {state.error && <span role="alert" className="text-sm text-sell">{state.error}</span>}
    </span>
  );
}
