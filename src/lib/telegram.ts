import "server-only";
import { serverEnv } from "./env";
import { createAdminClient } from "./supabase/admin";
import { sha256, urlToken } from "./secure";

const TOKEN_TTL_MS = 10 * 60 * 1000;

export class TelegramError extends Error {}

export async function tg<T = unknown>(method: string, params: Record<string, unknown>): Promise<T> {
  const token = serverEnv.telegramToken();
  if (!token) throw new TelegramError("ยังไม่ได้ตั้งค่าบอท Telegram");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(params),
    cache: "no-store",
  });
  const body = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!body.ok) throw new TelegramError(body.description ?? `Telegram ${method} failed`);
  return body.result as T;
}

/** Step 1 (web): one-time pairing token, stored as a digest. Returns the bot deep link. */
export async function issueLinkToken(userId: string) {
  const token = urlToken();
  const admin = createAdminClient();
  const { error } = await admin.from("telegram_link_tokens").upsert({
    user_id: userId,
    digest: sha256(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    tg_uid: null,
    tg_name: null,
    tg_username: null,
  });
  if (error) throw new TelegramError("สร้างลิงก์ไม่สำเร็จ");
  const bot = serverEnv.telegramBotUsername();
  return { token, url: bot ? `https://t.me/${bot}?start=${token}` : null };
}

type TgUser = { id: number; is_bot?: boolean; first_name?: string; last_name?: string; username?: string };

/** Step 2 (bot): the Telegram account that opened the deep link claims the token. */
export async function redeemLinkToken(token: string, user: TgUser) {
  if (user.is_bot || !Number.isInteger(user.id)) throw new TelegramError("บัญชี Telegram ไม่ถูกต้อง");
  const admin = createAdminClient();
  const { data } = await admin
    .from("telegram_link_tokens")
    .update({
      tg_uid: String(user.id),
      tg_name: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim(),
      tg_username: user.username ?? "",
    })
    .eq("digest", sha256(token))
    .gt("expires_at", new Date().toISOString())
    .is("tg_uid", null)
    .select("user_id")
    .maybeSingle();
  if (!data) throw new TelegramError("ลิงก์หมดอายุหรือถูกใช้แล้ว กรุณาขอใหม่จากเว็บ");
}

/** Step 3 (web): the member confirms the Telegram identity shown on screen. */
export async function confirmLink(userId: string) {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("telegram_link_tokens")
    .select("*")
    .eq("user_id", userId)
    .not("tg_uid", "is", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!row) throw new TelegramError("ไม่พบการยืนยันจาก Telegram หรือรหัสหมดอายุ");

  const { data: others } = await admin
    .from("telegram_links")
    .select("user_id, tg_uid")
    .or(`tg_uid.eq.${row.tg_uid},user_id.eq.${userId}`);
  if (others?.some((x) => x.tg_uid !== row.tg_uid || x.user_id !== userId)) {
    throw new TelegramError("บัญชีนี้เชื่อมกับสมาชิกอื่นแล้ว ให้แอดมินตรวจสอบ");
  }

  const { error } = await admin.from("telegram_links").upsert({
    user_id: userId,
    tg_uid: row.tg_uid,
    tg_name: row.tg_name,
    tg_username: row.tg_username,
  });
  if (error) throw new TelegramError("เชื่อม Telegram ไม่สำเร็จ");
  await admin.from("telegram_link_tokens").delete().eq("user_id", userId);
}

async function memberMayJoin(userId: string, roomId: string) {
  const admin = createAdminClient();
  const [{ data: profile }, { data: indicator }] = await Promise.all([
    admin.from("profiles").select("ib_verified").eq("id", userId).single(),
    admin.from("indicators").select("code").eq("telegram_room_id", roomId).maybeSingle(),
  ]);
  if (!profile?.ib_verified || !indicator) return false;
  const { data: right } = await admin
    .from("indicator_rights")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("code", indicator.code)
    .maybeSingle();
  return Boolean(right && (right.expires_at === null || new Date(right.expires_at) > new Date()));
}

/** Single-use join-request invite for an indicator room (port of request_room). */
export async function requestRoomInvite(userId: string, code: string) {
  const admin = createAdminClient();
  const [{ data: link }, { data: indicator }] = await Promise.all([
    admin.from("telegram_links").select("tg_uid").eq("user_id", userId).maybeSingle(),
    admin.from("indicators").select("telegram_room_id").eq("code", code).maybeSingle(),
  ]);
  if (!link) throw new TelegramError("กรุณาเชื่อม Telegram ก่อน");
  const room = indicator?.telegram_room_id;
  if (!room) throw new TelegramError("อินดิเคเตอร์นี้ยังไม่มีห้อง Telegram");
  if (!(await memberMayJoin(userId, room))) throw new TelegramError("ยังไม่มีสิทธิ์ห้องนี้ หรือยังไม่ผ่านการตรวจ IB กรุณาติดต่อแอดมิน");

  const expires = Math.floor(Date.now() / 1000) + 600;
  const invite = await tg<{ invite_link: string }>("createChatInviteLink", {
    chat_id: room,
    creates_join_request: true,
    expire_date: expires,
    name: `web_${urlToken().slice(0, 16)}`,
  });
  await admin.from("telegram_invites").insert({
    invite_url: invite.invite_link,
    user_id: userId,
    tg_uid: link.tg_uid,
    room_id: room,
    expires_at: new Date(expires * 1000).toISOString(),
  });
  return invite.invite_link;
}

type JoinRequest = {
  chat: { id: number };
  from: { id: number };
  invite_link?: { invite_link: string; name?: string };
};

/** Approve only the linked Telegram account that holds a valid invite and still has rights (port of approve). */
export async function handleJoinRequest(req: JoinRequest) {
  const url = req.invite_link?.invite_link ?? "";
  const admin = createAdminClient();
  const { data: invite } = await admin.from("telegram_invites").select("*").eq("invite_url", url).maybeSingle();
  if (!invite && !String(req.invite_link?.name ?? "").startsWith("web_")) return false;

  const uid = String(req.from.id);
  const room = String(req.chat.id);
  let allowed = Boolean(invite && invite.tg_uid === uid && invite.room_id === room && new Date(invite.expires_at) > new Date());
  if (allowed && invite) {
    const { data: link } = await admin.from("telegram_links").select("user_id").eq("tg_uid", uid).maybeSingle();
    allowed = Boolean(link && link.user_id === invite.user_id && (await memberMayJoin(invite.user_id, room)));
  }
  await tg(allowed ? "approveChatJoinRequest" : "declineChatJoinRequest", { chat_id: room, user_id: Number(uid) });
  if (allowed) {
    await admin.from("telegram_invites").delete().eq("invite_url", url);
    await tg("revokeChatInviteLink", { chat_id: room, invite_link: url }).catch(() => undefined);
  }
  return true;
}
