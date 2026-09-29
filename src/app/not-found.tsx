import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="space-y-5">
        <Logo />
        <p className="num text-6xl font-semibold text-gold">404</p>
        <p className="text-muted">ไม่พบหน้านี้ หรือคุณไม่มีสิทธิ์ดู</p>
        <ButtonLink href="/">กลับหน้าแรก</ButtonLink>
      </div>
    </main>
  );
}
