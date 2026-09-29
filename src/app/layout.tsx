import type { Metadata, Viewport } from "next";
import { Anuphan, JetBrains_Mono } from "next/font/google";
import { isMockMode } from "@/lib/mock/mode";
import "./globals.css";

const anuphan = Anuphan({ subsets: ["thai", "latin"], variable: "--font-anuphan", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "1SHOT Signals — สัญญาณทองคำที่ตรวจสอบได้", template: "%s · 1SHOT" },
  description: "สัญญาณ XAUUSD จากอินดิเคเตอร์ 1SHOT ทั้ง 10 ตัว ส่งตรงจาก TradingView ถึงเว็บและ Telegram พร้อมระดับ Entry / SL / TP ที่ย้อนตรวจได้ทุกจุด",
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${anuphan.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">
        {isMockMode() && (
          <div className="bg-brand px-4 py-1.5 text-center text-[11px] font-medium text-white">
            โหมดตัวอย่าง (Mockup) · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง ไม่ได้เชื่อมฐานข้อมูลจริง
          </div>
        )}
        {children}
      </body>
    </html>
  );
}
