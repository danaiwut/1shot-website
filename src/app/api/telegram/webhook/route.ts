// Telegram bot updates (setWebhook with secret_token = TELEGRAM_WEBHOOK_SECRET).
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { safeEqual } from "@/lib/secure";
import { handleJoinRequest, redeemLinkToken, tg, TelegramError } from "@/lib/telegram";

export const runtime = "nodejs";

type Update = {
  message?: { chat: { id: number; type: string }; from?: { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string }; text?: string };
  chat_join_request?: Parameters<typeof handleJoinRequest>[0];
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!safeEqual(secret, serverEnv.telegramWebhookSecret())) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const update = (await request.json()) as Update;

  try {
    if (update.chat_join_request) {
      await handleJoinRequest(update.chat_join_request);
    } else if (update.message?.chat.type === "private" && update.message.from) {
      const match = /^\/start\s+([A-Za-z0-9_-]{20,64})$/.exec(update.message.text ?? "");
      if (match) {
        let reply = "ยืนยันตัวตนแล้ว ✅ กลับไปที่หน้าเว็บแล้วกด “ยืนยันการเชื่อม” เพื่อจบขั้นตอน";
        try {
          await redeemLinkToken(match[1], update.message.from);
        } catch (err) {
          reply = err instanceof TelegramError ? err.message : "เกิดข้อผิดพลาด กรุณาลองใหม่";
        }
        await tg("sendMessage", { chat_id: update.message.chat.id, text: reply });
      }
    }
  } catch (err) {
    console.error("telegram webhook", err);
  }
  // Always 200 so Telegram does not redeliver the same update.
  return NextResponse.json({ ok: true });
}
