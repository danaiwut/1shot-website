import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="surface-dark relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 text-center">
      <div className="brand-glow pointer-events-none absolute inset-0" />
      <div className="relative flex flex-col items-center space-y-5">
        <Logo />
        <p className="num text-7xl font-bold text-accent">404</p>
        <p className="text-muted">ไม่พบหน้านี้ หรือคุณไม่มีสิทธิ์ดู</p>
        <ButtonLink href="/">กลับหน้าแรก</ButtonLink>
      </div>
    </main>
  );
}
