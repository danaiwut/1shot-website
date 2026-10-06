"use client";
import { useActionState, useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Button, cx, Field, Notice } from "@/components/ui";
import { deleteReview, saveReview } from "@/lib/reviews/actions";

const LABELS = ["", "แย่", "พอใช้", "ดี", "ดีมาก", "ยอดเยี่ยม"];

export function ReviewForm({ code, mine }: { code: string; mine?: { rating: number; body: string } }) {
  const [state, action, pending] = useActionState(saveReview, {});
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [removing, startRemove] = useTransition();
  const shown = hover || rating;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <fieldset>
        <legend className="text-[13px] font-medium">ให้คะแนน<span aria-hidden className="ml-0.5 text-accent">*</span><span className="sr-only"> (จำเป็น)</span></legend>
        {/* Native radios: arrow keys move between stars, and each has a spoken label. */}
        <div className="mt-1.5 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer rounded-md p-0.5">
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" required />
              <Star aria-hidden className={cx("size-7 transition-colors", n <= shown ? "fill-[#f5a524] text-[#f5a524]" : "text-line-strong")} strokeWidth={1.5} />
              <span className="sr-only">{n} ดาว · {LABELS[n]}</span>
            </label>
          ))}
          <span aria-hidden className="ml-2 text-sm text-muted">{shown ? LABELS[shown] : "เลือกดาว"}</span>
        </div>
      </fieldset>
      <Field label="ความคิดเห็น" hint="เล่าประสบการณ์ใช้งานจริง ไม่เกิน 1,000 ตัวอักษร">
        <textarea name="body" rows={4} maxLength={1000} defaultValue={mine?.body}
          className="w-full rounded-lg border border-line-strong bg-panel px-3 py-2 text-sm focus:border-brand/70 focus:outline-none focus:ring-2 focus:ring-brand/15" />
      </Field>
      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : mine ? "อัปเดตรีวิว" : "ส่งรีวิว"}</Button>
        {mine && (
          <Button type="button" variant="ghost" disabled={removing} onClick={() => confirm("ลบรีวิวของคุณ?") && startRemove(() => deleteReview(code))}>
            ลบรีวิว
          </Button>
        )}
      </div>
    </form>
  );
}
