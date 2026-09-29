"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Send } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";
import type { Profile } from "@/lib/types";
import { confirmTelegramLink, joinRoom, saveProfile, startTelegramLink } from "./actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action} className="space-y-4 p-5">
      <Field label="ชื่อที่แสดง">
        <Input name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} />
      </Field>
      <Field label="ชื่อผู้ใช้ TradingView" hint="ใช้ตรวจและให้สิทธิ์อินดิเคเตอร์ในบัญชี TradingView ของคุณ">
        <Input name="tradingview_username" defaultValue={profile.tradingview_username ?? ""} placeholder="เช่น trader_1shot" autoComplete="off" />
      </Field>
      <Field label="เลขบัญชี Exness" hint="ถ้าเปลี่ยนเลขบัญชี ต้องรอแอดมินตรวจ IB ใหม่">
        <Input name="exness_account" defaultValue={profile.exness_account ?? ""} inputMode="numeric" placeholder="เช่น 12345678" autoComplete="off" />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึก"}</Button>
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
        <Button
          disabled={busy}
          onClick={() => start(async () => {
            const r = await confirmTelegramLink();
            setMessage(r.error ? { tone: "error", text: r.error } : { tone: "success", text: r.ok! });
            router.refresh();
          })}
        >
          ยืนยันการเชื่อม
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!link ? (
        <Button
          disabled={busy}
          onClick={() => start(async () => {
            const r = await startTelegramLink();
            if (r.error) setMessage({ tone: "error", text: r.error });
            else setLink(r);
          })}
        >
          <Send className="size-4" /> เชื่อม Telegram
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-panel-2 p-4">
          <p className="text-sm">เปิดบอทแล้วกด <b>Start</b> ภายใน 10 นาที หน้านี้จะอัปเดตเองเมื่อบอทได้รับรหัส</p>
          {link.url ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
              เปิดบอท Telegram <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <code className="num flex-1 truncate rounded-md bg-ink px-3 py-2 text-xs">/start {link.token}</code>
              <Button variant="outline" className="h-8 px-2.5" onClick={() => navigator.clipboard.writeText(`/start ${link.token}`)} aria-label="คัดลอก"><Copy className="size-3.5" /></Button>
            </div>
          )}
          <p className="flex items-center gap-2 text-xs text-muted"><span className="size-1.5 rounded-full bg-gold animate-pulse-dot" /> รอการยืนยันจาก Telegram…</p>
        </div>
      )}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
    </div>
  );
}

export function RoomButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        className="h-8 px-3 text-xs"
        disabled={busy || disabled}
        onClick={() => start(async () => {
          setError(undefined);
          const r = await joinRoom(code);
          if (r.url) window.open(r.url, "_blank", "noopener");
          else setError(r.error);
        })}
      >
        {busy ? "กำลังสร้าง…" : "ขอเข้าห้อง"}
      </Button>
      {error && <span className="max-w-56 text-right text-[11px] text-sell">{error}</span>}
    </div>
  );
}
