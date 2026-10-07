import "server-only";
import type { requireStaff } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { fmtTHB } from "@/lib/store/pricing";
import { requestSubject } from "@/lib/support";
import type { SupportKind } from "@/lib/types";

type Client = Awaited<ReturnType<typeof requireStaff>>["supabase"];
type Who = { email: string; display_name: string | null } | null;
export type TodoItem = { key: string; href: string; title: string; meta: string };
export type TodoGroup = { id: string; title: string; action: string; href: string; items: TodoItem[] };

const name = (p: Who) => p?.display_name || p?.email || "—";
const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

/** Everything waiting on staff, in plain words, most urgent first. Groups with nothing to do are left out. */
export async function loadTodo(supabase: Client): Promise<TodoGroup[]> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const in7 = new Date(now + 7 * 864e5).toISOString();
  const d1 = new Date(now - 864e5).toISOString();
  const hour = new Date(now - 36e5).toISOString();

  const [support, tv, grants, ib, expiring, orders, hooks] = await Promise.all([
    supabase.from("support_requests").select("id, kind, indicator_code, updated_at, profiles!support_requests_user_id_fkey(email, display_name)").eq("status", "open").order("updated_at").limit(20),
    supabase.from("indicator_rights").select("user_id, code, expires_at, tv_synced_at, tv_synced_expires, profiles!indicator_rights_user_id_fkey(email, display_name, tradingview_username)").or(`expires_at.is.null,expires_at.gt.${nowIso}`).limit(300),
    supabase.from("tradingview_grants").select("username, code, expires_at, tv_synced_at, tv_synced_expires").or(`expires_at.is.null,expires_at.gt.${nowIso}`).limit(300),
    supabase.from("profiles").select("id, email, display_name, exness_account, created_at").not("exness_account", "is", null).eq("ib_verified", false).order("created_at").limit(20),
    supabase.from("indicator_rights").select("user_id, code, expires_at, profiles!indicator_rights_user_id_fkey(email, display_name)").gte("expires_at", nowIso).lte("expires_at", in7).order("expires_at").limit(30),
    supabase.from("orders").select("id, amount_satang, created_at, profiles(email, display_name)").eq("status", "pending").lt("created_at", hour).order("created_at", { ascending: false }).limit(20),
    supabase.from("webhook_receipts").select("id, received_at, error").eq("ok", false).gte("received_at", d1).order("received_at", { ascending: false }).limit(20),
  ]);

  type TvRow = { user_id: string; code: string; expires_at: string | null; tv_synced_at: string | null; tv_synced_expires: string | null; profiles: (Who & { tradingview_username: string | null }) | null };
  type Sync = { expires_at: string | null; tv_synced_at: string | null; tv_synced_expires: string | null };
  const needsTv = (r: Sync) => !r.tv_synced_at || (r.tv_synced_expires ?? null) !== (r.expires_at ?? null);
  const tvPending = ((tv.data ?? []) as unknown as TvRow[]).filter(needsTv);
  const grantPending = ((grants.data ?? []) as (Sync & { username: string; code: string })[]).filter(needsTv);

  const groups: TodoGroup[] = [
    {
      id: "support", title: "ลูกค้าส่งคำขอมา", action: "ตอบคำขอ", href: "/admin/support?status=open",
      items: (support.data ?? []).map((r) => ({ key: r.id, href: `/admin/support/${r.id}`, title: `${requestSubject(r.kind as SupportKind, r.indicator_code)} · ${name(one(r.profiles as Who | Who[]))}`, meta: fmtDateTime(r.updated_at) })),
    },
    {
      id: "tv", title: "ต้องเปิดสิทธิ์ใน TradingView", action: "เปิดสิทธิ์", href: "/admin/rights#tv",
      items: [
        ...tvPending.map((r) => ({ key: `${r.user_id}-${r.code}`, href: "/admin/rights#tv", title: `${r.code} · ${r.profiles?.tradingview_username || name(r.profiles)}`, meta: r.expires_at ? `ถึง ${fmtDate(r.expires_at)}` : "ตลอดชีพ" })),
        ...grantPending.map((g) => ({ key: `g-${g.username}-${g.code}`, href: "/admin/rights#tv", title: `${g.code} · ${g.username}`, meta: g.expires_at ? `ถึง ${fmtDate(g.expires_at)}` : "ตลอดชีพ" })),
      ],
    },
    {
      id: "ib", title: "ลูกค้ารอยืนยัน Exness IB", action: "ตรวจบัญชี", href: "/admin/members?status=pending",
      items: (ib.data ?? []).map((p) => ({ key: p.id, href: `/admin/members/${p.id}`, title: `${name(p)} · บัญชี ${p.exness_account}`, meta: fmtDate(p.created_at) })),
    },
    {
      id: "expiring", title: "สิทธิ์ลูกค้าจะหมดใน 7 วัน", action: "ดูลูกค้า", href: "/admin/members?status=expiring",
      items: (expiring.data ?? []).map((r) => ({ key: `${r.user_id}-${r.code}`, href: `/admin/members/${r.user_id}`, title: `${r.code} · ${name(one(r.profiles as Who | Who[]))}`, meta: `หมด ${fmtDate(r.expires_at)}` })),
    },
    {
      id: "orders", title: "ลูกค้ากดซื้อแต่ยังไม่จ่าย", action: "ดูรายการ", href: "/admin/orders?status=pending",
      items: (orders.data ?? []).map((o) => ({ key: o.id, href: "/admin/orders?status=pending", title: `${fmtTHB(o.amount_satang)} · ${name(one(o.profiles as Who | Who[]))}`, meta: fmtDateTime(o.created_at) })),
    },
    {
      id: "hooks", title: "ระบบรับเงินแจ้งข้อผิดพลาด", action: "ดูรายละเอียด", href: "/admin/webhooks",
      items: (hooks.data ?? []).map((h) => ({ key: String(h.id), href: "/admin/webhooks", title: h.error || "ไม่ทราบสาเหตุ", meta: fmtDateTime(h.received_at) })),
    },
  ];
  return groups.filter((g) => g.items.length > 0);
}
