// TradingView alert webhook. TradingView cannot send custom headers, so the secret lives in the path
// (same approach as the legacy /hook/<secret>). Keep the full URL private.
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";
import { safeEqual } from "@/lib/secure";
import { ingestAlert } from "@/lib/signals/ingest";

export const runtime = "nodejs";
const MAX_BYTES = 64 * 1024;

export async function POST(request: Request, ctx: RouteContext<"/api/webhook/tradingview/[secret]">) {
  const { secret } = await ctx.params;
  const expected = serverEnv.webhookSecret();
  const provided = secret === "_" ? request.headers.get("x-1shot-secret") ?? "" : secret;
  if (!expected || !safeEqual(provided, expected)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const text = await request.text();
  if (text.length > MAX_BYTES) return NextResponse.json({ error: "payload too large" }, { status: 413 });

  const result = await ingestAlert(text);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  // Duplicates return 200 with inserted: 0 so TradingView does not retry.
  return NextResponse.json(result);
}
