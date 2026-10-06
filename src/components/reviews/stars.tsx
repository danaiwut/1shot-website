import { Star } from "lucide-react";
import { cx } from "@/components/ui";

/** Read-only stars (supports halves via a clipped overlay). The number is given as text for screen readers. */
export function Stars({ value, size = "sm", className }: { value: number; size?: "sm" | "md"; className?: string }) {
  const s = size === "md" ? "size-5" : "size-3.5";
  return (
    <span className={cx("inline-flex items-center", className)} role="img" aria-label={`${value.toFixed(1)} จาก 5 ดาว`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className={cx("relative", s)}>
            <Star aria-hidden className={cx("absolute inset-0 text-line-strong", s)} strokeWidth={1.5} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star aria-hidden className={cx("fill-[#f5a524] text-[#f5a524]", s)} strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/** "★ 4.6 (12 รีวิว)" or a quiet placeholder when nobody has reviewed yet. */
export function RatingSummary({ avg, count, className }: { avg?: number; count?: number; className?: string }) {
  if (!count || avg === undefined) return <span className={cx("text-xs text-muted", className)}>ยังไม่มีรีวิว</span>;
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-xs", className)}>
      <Stars value={avg} />
      <span className="num font-semibold text-fg">{avg.toFixed(1)}</span>
      <span className="text-muted">({count} รีวิว)</span>
    </span>
  );
}
