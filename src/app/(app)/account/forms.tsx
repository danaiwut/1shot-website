"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Send } from "lucide-react";
import { SubmitButton } from "@/components/app/form-kit";
import { Button, cx, Field, Input, Notice } from "@/components/ui";
import type { Profile } from "@/lib/types";
import { confirmTelegramLink, joinRoom, saveProfile, startTelegramLink } from "./actions";

const PILL = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-60";
const PILL_BRAND = cx(PILL, "bg-brand text-white shadow-[0_16px_40px_-16px_rgb(178_0_22/0.8)] hover:bg-brand-strong");
const PILL_GHOST = cx(PILL, "border border-line bg-panel text-fg hover:border-brand/50 hover:text-accent");

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="ชื่อที่แสดง">
          <Input name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} placeholder="ชื่อที่ทีมงานจะเห็น" />
        </Field>
        <Field label="ชื่อผู้ใช้ TradingView" hint="ใช้ตรวจและให้สิทธิ์อินดิเคเตอร์ในบัญชี TradingView ของคุณ">
          <Input name="tradingview_username" defaultValue={profile.tradingview_username ?? ""} placeholder="เช่น trader_1shot" autoComplete="off" spellCheck={false} className="num" />
        </Field>
      </div>
      <div className="rounded-xl border border-dashed border-line-strong/60 bg-panel-2 p-4">
        <Field label="เลขบัญชี Exness (ไม่บังคับ)" hint="กรอกถ้าเปิดบัญชีภายใต้ IB ของเรา เพื่อขอใช้ฟรี แอดมินจะตรวจแล้วให้สิทธิ์ ถ้าซื้อแพ็กเกจแล้วไม่ต้องกรอก">
          <Input name="exness_account" defaultValue={profile.exness_account ?? ""} inputMode="numeric" placeholder="เช่น 12345678" autoComplete="off" className="num md:max-w-sm" />
        </Field>
      </div>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <SubmitButton pending={pending} className="sm:w-auto sm:px-8">บันทึกข้อมูล</SubmitButton>
    </form>
  );
}

export function TelegramLinker({ pending }: { pending: { name: string | null; username: string | null } | null }) {
  const router = useRouter();
  const [link, setLink] = useState<{ url?: string | null; token?: string } | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, start] = useTransition();

  // While waiting for the bot, poll the server page for the pending Telegram identity.
  useEffect(() => {
    if (!link || pending) return;
    const t = setInterval(() => router.refresh(), 3000);
    const stop = setTimeout(() => clearInterval(t), 10 * 60 * 1000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [link, pending, router]);

  if (pending) {
    return (
      <div className="space-y-4">
        <Notice tone="info">
          Telegram <b>{pending.name || "ไม่ระบุชื่อ"}</b>{pending.username ? ` (@${pending.username})` : ""} ขอเชื่อมกับบัญชีนี้ ถ้าเป็นคุณ ให้กดยืนยัน
        </Notice>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        <button
          type="button"
          className={cx(PILL_BRAND, "w-full sm:w-auto")}
          disabled={busy}
          onClick={() => start(async () => {
            const r = await confirmTelegramLink();
            setMessage(r.error ? { tone: "error", text: r.error } : { tone: "success", text: r.ok! });
            router.refresh();
          })}
        >
          <Check aria-hidden className="size-4" /> ยืนยันการเชื่อม
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!link ? (
        <button
          type="button"
          className={cx(PILL_BRAND, "w-full sm:w-auto")}
          disabled={busy}
          onClick={() => start(async () => {
            const r = await startTelegramLink();
            if (r.error) setMessage({ tone: "error", text: r.error });
            else setLink(r);
          })}
        >
          <Send aria-hidden className="size-4" /> {busy ? "กำลังสร้างลิงก์…" : "เชื่อม Telegram"}
        </button>
      ) : (
        <div className="space-y-4 rounded-2xl border border-line bg-panel-2 p-5">
          <ol className="space-y-2 text-sm">
            <li className="flex gap-3"><span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">1</span>{link.url ? "เปิดบอท Telegram" : "คัดลอกคำสั่งไปส่งให้บอท"}</li>
            <li className="flex gap-3"><span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">2</span><span>กด <b>Start</b> ภายใน 10 นาที หน้านี้จะอัปเดตเองเมื่อบอทได้รับรหัส</span></li>
          </ol>
          {link.url ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={cx(PILL_BRAND, "w-full sm:w-auto")}>
              เปิดบอท Telegram <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> (เปิดแท็บใหม่)</span>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <code className="num flex h-11 min-w-0 flex-1 items-center truncate rounded-full border border-line bg-panel px-4 text-sm">/start {link.token}</code>
              <CopyButton text={`/start ${link.token}`} />
            </div>
          )}
          <p role="status" className="flex items-center gap-2 text-xs text-muted"><span aria-hidden className="size-1.5 rounded-full bg-brand animate-pulse-dot" /> รอการยืนยันจาก Telegram…</p>
        </div>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
}

/** "ขอเข้าห้อง": one-time Telegram invite for an indicator room. `block` stretches it to its container (dashboard cards). */
export function RoomButton({ code, disabled, block }: { code: string; disabled?: boolean; block?: boolean }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className={cx("flex flex-col gap-1", block ? "w-full items-stretch" : "items-end")}>
      <button
        type="button"
        className={cx(PILL_GHOST, block && "w-full")}
        aria-label={`ขอเข้าห้อง ${code}`}
        title={disabled ? "เชื่อม Telegram ก่อน" : undefined}
        disabled={busy || disabled}
        onClick={() => start(async () => {
          setError(undefined);
          const r = await joinRoom(code);
          if (r.url) window.open(r.url, "_blank", "noopener");
          else setError(r.error);
        })}
      >
        <Send aria-hidden className="size-4" /> {busy ? "กำลังสร้าง…" : "ขอเข้าห้อง"}
      </button>
      {error && <span role="alert" className={cx("text-sm text-sell", block ? "text-left" : "max-w-64 text-right")}>{error}</span>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <Button variant="outline" className="size-11 shrink-0 rounded-full px-0" aria-label="คัดลอกคำสั่ง" onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); })}>
        {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      </Button>
      <span role="status" className="sr-only">{done ? "คัดลอกแล้ว" : ""}</span>
    </>
  );
}
