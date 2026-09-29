import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-16">
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <div className="pointer-events-none absolute top-0 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-gold/10 blur-[110px]" />
      <div className="relative w-full max-w-sm animate-rise">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="rounded-2xl border border-line-strong bg-panel/90 p-7 shadow-2xl backdrop-blur">{children}</div>
      </div>
    </main>
  );
}
