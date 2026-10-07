"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, DoorOpen, ExternalLink, Save, Send } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { confirmTelegramLink, joinRoom, saveProfile, startTelegramLink } from "./actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState(saveProfile, {});
  return (
    <form action={action}>
      <div className="grid gap-5 px-6 py-6">
        <Field label="ชื่อที่แสดง">
          <Input name="display_name" defaultValue={profile.display_name ?? ""} maxLength={60} />
        </Field>
        <Field label="ชื่อผู้ใช้ TradingView" hint="ใช้ตรวจและให้สิทธิ์อินดิเคเตอร์ในบัญชี TradingView ของคุณ">
          <Input name="tradingview_username" defaultValue={profile.tradingview_username ?? ""} placeholder="เช่น trader_1shot" autoComplete="off" />
        </Field>
        <Field label="เลขบัญชี Exness (ไม่บังคับ)" hint="กรอกถ้าเปิดบัญชีภายใต้ IB ของเรา เพื่อขอใช้ฟรี แอดมินจะตรวจแล้วให้สิทธิ์ ถ้าซื้อแพ็กเกจแล้วไม่ต้องกรอก">
          <Input name="exness_account" defaultValue={profile.exness_account ?? ""} inputMode="numeric" placeholder="เช่น 12345678" autoComplete="off" />
        </Field>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
      </div>
      <div className="flex justify-end border-t border-line bg-panel-2/40 px-6 py-4">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto"><Save aria-hidden className="size-4" /> {pending ? "กำลังบันทึก…" : "บันทึก"}</Button>
      </div>
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
          <Send aria-hidden className="size-4" /> {busy ? "กำลังสร้างลิงก์…" : "เชื่อม Telegram"}
        </Button>
      ) : (
        <div className="space-y-3 rounded-xl border border-line bg-panel-2 p-4">
          <p className="text-sm">เปิดบอทแล้วกด <b>Start</b> ภายใน 10 นาที หน้านี้จะอัปเดตเองเมื่อบอทได้รับรหัส</p>
          {link.url ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "w-full sm:w-auto")}>
              <Send aria-hidden className="size-4" /> เปิดบอท Telegram <ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> (เปิดแท็บใหม่)</span>
            </a>
          ) : (
            <div className="flex items-center gap-2">
              <code className="num flex h-11 min-w-0 flex-1 items-center truncate rounded-lg border border-line bg-panel px-3 text-sm">/start {link.token}</code>
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

export function RoomButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [busy, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        aria-label={`ขอเข้าห้อง ${code}`}
        disabled={busy || disabled}
        onClick={() => start(async () => {
          setError(undefined);
          const r = await joinRoom(code);
          if (r.url) window.open(r.url, "_blank", "noopener");
          else setError(r.error);
        })}
      >
        <DoorOpen aria-hidden className="size-4" /> {busy ? "กำลังสร้าง…" : "ขอเข้าห้อง"}
      </Button>
      {error && <span role="alert" className="max-w-64 text-right text-sm text-sell">{error}</span>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <>
      <Button variant="outline" className="w-11 px-0" aria-label="คัดลอกคำสั่ง" onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); })}>
        {done ? <Check aria-hidden className="size-4" /> : <Copy aria-hidden className="size-4" />}
      </Button>
      <span role="status" className="sr-only">{done ? "คัดลอกแล้ว" : ""}</span>
    </>
  );
}
