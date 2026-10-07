"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { syncExness } from "@/lib/exness";

export type SyncState = { error?: string; ok?: string };

export async function syncNow(_: SyncState): Promise<SyncState> {
  await requireStaff();
  const r = await syncExness("manual");
  revalidatePath("/admin/lots");
  return r.ok ? { ok: `ดึงข้อมูลสำเร็จ ${r.rows} แถว` } : { error: r.error ?? "ดึงข้อมูลไม่สำเร็จ" };
}
