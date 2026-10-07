import { notFound } from "next/navigation";
import { BackLink, SettingsSection } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { Notice } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { loadCatalog, loadOwnership } from "@/lib/store/catalog";
import { parseCodes } from "@/lib/store/pick";
import { fmtTHB, priceSuffix } from "@/lib/store/pricing";
import { CheckoutForm } from "./form";

export const metadata = { title: "ยืนยันข้อมูลก่อนชำระเงิน" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const priceId = typeof sp.price === "string" ? sp.price : "";
  const from = typeof sp.from === "string" && sp.from.startsWith("/") && !sp.from.startsWith("//") ? sp.from : "/store";
  if (!/^[0-9a-f-]{36}$/i.test(priceId)) notFound();

  const { supabase, profile, userId } = await requireViewer();
  const [products, owned] = await Promise.all([loadCatalog(supabase), loadOwnership(supabase, userId)]);
  const product = products.find((p) => p.prices.some((x) => x.id === priceId));
  const price = product?.prices.find((x) => x.id === priceId);
  if (!product || !price) notFound();

  const lifetime = Object.entries(owned.access).filter(([, exp]) => exp === null).map(([c]) => c);
  const pick = product.kind === "pick" ? product.pick_count ?? 1 : 0;
  const preset = parseCodes(typeof sp.codes === "string" ? sp.codes : undefined)
    .filter((c) => product.codes.includes(c) && !lifetime.includes(c)).slice(0, pick);

  return (
    <>
      <BackLink href={from}>กลับ</BackLink>
      <PageHeader title="ยืนยันข้อมูลก่อนชำระเงิน" description="ข้อมูลนี้ใช้เปิดสิทธิ์อินดิเคเตอร์ให้คุณใน TradingView อัตโนมัติหลังชำระเงินสำเร็จ" />
      <div className="max-w-4xl">
        {product.audience === "returning" && !owned.returning && (
          <div className="mb-6"><Notice tone="error">ราคานี้สำหรับลูกค้าที่เคยซื้อแล้วเท่านั้น บัญชีนี้ยังไม่มีประวัติการซื้อ</Notice></div>
        )}
        <SettingsSection title="สิ่งที่สั่งซื้อ">
          <div className="rounded-lg border border-line bg-panel px-4 py-4 sm:px-5">
            <p className="font-semibold">{product.name}</p>
            <p className="num mt-1 text-xl font-semibold tabular-nums">{fmtTHB(price.amount_satang)} <span className="text-sm font-normal text-muted">{priceSuffix(price)}</span></p>
            {!pick && <p className="mt-2 text-sm text-muted">อินดิเคเตอร์: <span className="num">{product.codes.join(" · ")}</span></p>}
            {product.available_until && <p className="mt-1 text-sm text-accent">โปรโมชั่นถึง {fmtDate(product.available_until)}</p>}
            <p className="mt-1 text-sm text-muted">มีโค้ดส่วนลด? กรอกได้ในหน้าชำระเงินของ Stripe</p>
          </div>
        </SettingsSection>
        <SettingsSection title="ข้อมูลของคุณ" description="ตรวจชื่อผู้ใช้ TradingView กับ TradingView ให้อัตโนมัติ">
          <CheckoutForm
            priceId={price.id}
            tradingview={profile.tradingview_username ?? ""}
            account={profile.exness_account ?? ""}
            email={profile.email}
            pick={pick ? {
              count: pick,
              pool: product.codes.map((code) => ({ code, name: product.names[code] ?? code })),
              chosen: preset,
              owned: lifetime,
              parts: price.parts,
              amount: price.amount_satang,
            } : undefined}
          />
        </SettingsSection>
      </div>
    </>
  );
}
