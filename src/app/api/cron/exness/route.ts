import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";
import { syncExness } from "@/lib/exness";

/** Daily Exness lot sync (vercel.json → crons). Vercel sends `Authorization: Bearer <CRON_SECRET>`. */
export async function GET(request: NextRequest) {
  const secret = serverEnv.cronSecret();
  const got = request.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  if (!secret || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await syncExness("cron");
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
