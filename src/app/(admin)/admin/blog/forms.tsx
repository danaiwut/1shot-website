"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ImagePlus, Link2, Loader2, X } from "lucide-react";
import { Button, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { deleteBlogPost, previewPost, saveBlogPost, setBlogActive, type BlogState, type Preview } from "./actions";

/** Paste a Facebook link → "ดึงตัวอย่าง" fills text and images → check → save. */
export function AddPostForm({ defaultPage }: { defaultPage: string }) {
  const [state, action, pending] = useActionState<BlogState, FormData>(saveBlogPost, {});
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [fetchError, setFetchError] = useState<string>();
  const [loading, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    setUrl(""); setPreview(null); setImages([]); setBody(""); setFetchError(undefined);
  }, [state]);

  const fetchPreview = () => start(async () => {
    const r = await previewPost(url);
    setFetchError(r.error);
    if (r.preview) { setPreview(r.preview); setImages(r.preview.images); setBody(r.preview.description); }
  });

  return (
    <form ref={form} action={action} className="space-y-5">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <Field label="ลิงก์โพสต์ Facebook" required hint="โพสต์ต้องตั้งเป็นสาธารณะ">
            <Input name="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.facebook.com/…" />
          </Field>
        </div>
        <Button type="button" variant="outline" disabled={!url || loading} onClick={fetchPreview} className="mb-6">
          {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Link2 aria-hidden className="size-4" />}
          {loading ? "กำลังดึง…" : "ดึงตัวอย่าง"}
        </Button>
      </div>
      {fetchError && <Notice tone="error">{fetchError}</Notice>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อเพจ"><Input name="page_name" defaultValue={defaultPage} maxLength={80} /></Field>
        <Field label="วันเวลาที่โพสต์" hint="ว่าง = ตอนนี้"><Input name="posted_at" type="datetime-local" /></Field>
      </div>
      <Field label="ข้อความ" hint={preview ? "ดึงจาก Facebook แล้ว แก้ได้" : undefined}>
        <Textarea name="body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="bg-panel text-sm" />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">รูป <span className="font-normal text-muted">(สูงสุด 8 รูป · ระบบเก็บสำเนาไว้เอง)</span></legend>
        {images.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2">
            {images.map((src) => (
              <li key={src} className="relative">
                <input type="hidden" name="image_urls" value={src} />
                {/* eslint-disable-next-line @next/next/no-img-element -- preview of a Facebook image */}
                <img src={src} alt="" className="size-24 rounded-lg border border-line object-cover" />
                <button type="button" onClick={() => setImages((l) => l.filter((x) => x !== src))} aria-label="เอารูปนี้ออก" className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-fg text-ink">
                  <X aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line-strong px-4 text-sm font-medium hover:border-fg has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
          <ImagePlus aria-hidden className="size-4" /> เพิ่มรูปจากเครื่อง
          <input type="file" name="files" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" />
        </label>
        <p className="mt-1 text-xs text-muted">ไฟล์รวมไม่เกิน 5 MB ต่อครั้ง</p>
      </fieldset>

      {state.error && <Notice tone="error">{state.error}</Notice>}
      {state.ok && <Notice tone="success">{state.ok}</Notice>}
      <Button type="submit" disabled={pending}>{pending ? "กำลังบันทึก…" : "เพิ่มโพสต์"}</Button>
    </form>
  );
}

export function PostControls({ id, active }: { id: string; active: boolean }) {
  const [busy, start] = useTransition();
  return (
    <span className="flex items-center gap-1">
      <Button type="button" variant="outline" disabled={busy} onClick={() => start(() => setBlogActive(id, !active))}>{active ? "ซ่อน" : "แสดง"}</Button>
      <Button type="button" variant="ghost" className="text-sell hover:text-sell" disabled={busy} onClick={() => confirm("ลบโพสต์นี้ออกจากเว็บ?") && start(() => deleteBlogPost(id))}>ลบ</Button>
    </span>
  );
}
