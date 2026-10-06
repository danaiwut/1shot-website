import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_Thai } from "next/font/google";
import { MotionPrefProvider } from "@/components/motion/motion-pref";
import { MOTION_SCRIPT, THEME_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const notoThai = Noto_Sans_Thai({ subsets: ["thai", "latin"], variable: "--font-noto-thai", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: { default: "1SHOT Signals — สัญญาณทองคำที่ตรวจสอบได้", template: "%s · 1SHOT" },
  description: "สัญญาณ XAUUSD จากอินดิเคเตอร์ 1SHOT ทั้ง 10 ตัว ส่งตรงจาก TradingView ถึงเว็บและ Telegram พร้อมระดับ Entry / SL / TP ที่ย้อนตรวจได้ทุกจุด",
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-scroll-behavior="smooth" suppressHydrationWarning className={`${notoThai.variable} ${mono.variable}`}>
      <head>
        {/* Applies the saved theme and "หยุดภาพเคลื่อนไหว" choice before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT + MOTION_SCRIPT }} />
      </head>
      <body className="min-h-dvh font-sans">
        <MotionPrefProvider>{children}</MotionPrefProvider>
      </body>
    </html>
  );
}
