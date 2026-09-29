import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="surface-dark relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-16">
      <div className="brand-glow pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
            <div className="relative w-full max-w-sm animate-rise">
        <Link href="/" className="mb-8 flex justify-center"><Logo /></Link>
        <div className="surface-light rounded-3xl bg-panel p-7 shadow-[0_40px_100px_-30px_rgb(178_0_22/0.6)]">{children}</div>
      </div>
    </main>
  );
}
