"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Globe, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { FormLayout, Panel, Step, SubmitButton } from "@/components/app/form-kit";
import { Button, Field, Input, Notice } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { deleteBlogPost, previewPost, saveBlogPost, setBlogActive, type BlogState, type Preview } from "./blog-actions";

const when = (local: string) => {
  const d = local ? new Date(`${local}:00+07:00`) : new Date();
  const day = d.toLocaleDateString("th-TH", { day: "numeric", month: "long", timeZone: "Asia/Bangkok" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
  return `${day} เวลา ${time} น.`;
};

/** Paste a Facebook link → "ดึงตัวอย่าง" fills text and images → check the card on the right → save. */
export function AddPostForm({ defaultPage, avatar }: { defaultPage: string; avatar: string }) {
  const [state, action, pending] = useActionState<BlogState, FormData>(saveBlogPost, {});
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [page, setPage] = useState(defaultPage);
  const [postedAt, setPostedAt] = useState("");
  const [fetchError, setFetchError] = useState<string>();
  const [loading, start] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setFiles([]); // React clears the file input after every submit
    if (!state.ok) return;
    form.current?.reset();
    setUrl(""); setPreview(null); setImages([]); setBody(""); setPage(defaultPage); setPostedAt(""); setFetchError(undefined);
  }, [state, defaultPage]);
  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f)), [files]);

  const fetchPreview = () => start(async () => {
    const r = await previewPost(url);
    setFetchError(r.error);
    if (r.preview) { setPreview(r.preview); setImages(r.preview.images); setBody(r.preview.description); }
  });
  const shown = [...images, ...files];

  return (
    <form ref={form} action={action}>
      <FormLayout aside={<>
        <Panel title="ตัวอย่างการ์ดบนหน้าแรก">
          <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_20px_50px_-35px_rgb(0_0_0/0.5)]">
            <div className="flex items-center gap-3 px-4 pt-4">
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- page avatar */}
                <img src={avatar} alt="" className="size-10 rounded-full bg-ink object-cover object-top ring-2 ring-[#1877f2]" />
                <span aria-hidden className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-panel bg-[#31a24c]" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">{page || defaultPage}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted">{when(postedAt)} <Globe aria-hidden className="size-3" /></span>
              </span>
            </div>
            {body
              ? <p className="mt-3 line-clamp-3 px-4 text-sm leading-relaxed whitespace-pre-line">{body}</p>
              : <p className="mt-3 px-4 text-sm text-faint">ข้อความโพสต์จะแสดงตรงนี้</p>}
            <Collage images={shown} />
          </div>
        </Panel>
        {state.error && <Notice tone="error">{state.error}</Notice>}
        {state.ok && <Notice tone="success">{state.ok}</Notice>}
        <SubmitButton pending={pending}>เพิ่มโพสต์ขึ้นหน้าแรก</SubmitButton>
      </>}>
        <Step n={1} title="ลิงก์โพสต์ Facebook" hint="โพสต์ต้องตั้งเป็นสาธารณะ แล้วกด “ดึงตัวอย่าง” เพื่อเติมข้อความและรูปให้อัตโนมัติ">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <Input name="url" type="url" required aria-label="ลิงก์โพสต์ Facebook" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.facebook.com/jr1shot/posts/…" />
            </div>
            <Button type="button" disabled={!url || loading} onClick={fetchPreview} className="h-11 shrink-0 px-5">
              {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Link2 aria-hidden className="size-4" />}
              {loading ? "กำลังดึง…" : "ดึงตัวอย่าง"}
            </Button>
          </div>
          {fetchError && <div className="mt-3"><Notice tone="error">{fetchError}</Notice></div>}
          {preview && !fetchError && <div className="mt-3"><Notice tone="success">ดึงข้อความและรูป {preview.images.length} รูปแล้ว ตรวจในขั้นถัดไป</Notice></div>}
        </Step>

        <Step n={2} title="ข้อความ">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ชื่อเพจ"><Input name="page_name" value={page} onChange={(e) => setPage(e.target.value)} maxLength={80} placeholder={defaultPage} /></Field>
              <Field label="วันเวลาที่โพสต์" hint="ว่าง = ตอนนี้"><Input name="posted_at" type="datetime-local" value={postedAt} onChange={(e) => setPostedAt(e.target.value)} /></Field>
            </div>
            <Field label="ข้อความ" hint={preview ? "ดึงจาก Facebook แล้ว แก้ได้" : "การ์ดแสดง 3 บรรทัดแรก"}>
              <Textarea name="body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="field-sizing-fixed bg-panel text-sm placeholder:text-faint"
                placeholder="ทองคำวันนี้เด้งรับแนวรับ 2,350 ตามที่ 1SHOT ส่งสัญญาณไว้เมื่อคืน…" />
            </Field>
          </div>
        </Step>

        <Step n={3} title="รูป" aside={<span className="rounded-full bg-panel-3 px-2.5 py-0.5 text-xs font-semibold text-muted tabular-nums">{shown.length} / 8 รูป</span>} hint="ระบบเก็บสำเนาไว้เอง รูปจาก Facebook ไม่หายแม้ลิงก์หมดอายุ">
          {images.length > 0 && (
            <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
              {images.map((src) => (
                <li key={src} className="relative">
                  <input type="hidden" name="image_urls" value={src} />
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview of a Facebook image */}
                  <img src={src} alt="" className="aspect-square w-full rounded-xl border border-line object-cover" />
                  <button type="button" onClick={() => setImages((l) => l.filter((x) => x !== src))} aria-label="เอารูปนี้ออก" className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-fg text-ink">
                    <X aria-hidden className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong px-4 py-5 text-center text-sm font-medium hover:border-fg has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50">
            <ImagePlus aria-hidden className="size-6 text-muted" />
            {files.length ? `เลือกจากเครื่องแล้ว ${files.length} รูป · กดเพื่อเปลี่ยน` : "เพิ่มรูปจากเครื่อง"}
            <span className="text-xs font-normal text-muted">PNG, JPG, WebP · รวมไม่เกิน 5 MB ต่อครั้ง</span>
            <input type="file" name="files" accept="image/png,image/jpeg,image/webp" multiple className="sr-only"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))} />
          </label>
        </Step>
      </FormLayout>
    </form>
  );
}

/** Facebook-style photo grid, as on the homepage card. */
function Collage({ images }: { images: string[] }) {
  if (!images.length) return <div className="mt-4" />;
  const img = (src: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- preview image
    <img key={src} src={src} alt="" className="size-full object-cover" />
  );
  if (images.length === 1) return <div className="mt-3 aspect-[16/10] bg-line">{img(images[0])}</div>;
  if (images.length === 2) return <div className="mt-3 grid aspect-[16/10] grid-cols-2 gap-0.5 bg-line">{images.map(img)}</div>;
  const rest = images.length - 5;
  return (
    <div className="mt-3 grid gap-0.5 bg-line">
      <div className="grid h-32 grid-cols-2 gap-0.5">{images.slice(0, 2).map(img)}</div>
      <div className="grid h-20 grid-cols-3 gap-0.5">
        {images.slice(2, 5).map((s, i) => (
          <div key={s} className="relative">
            {img(s)}
            {i === 2 && rest > 0 && <span className="absolute inset-0 grid place-items-center bg-black/55 text-xl font-bold text-white">+{rest}</span>}
          </div>
        ))}
      </div>
    </div>
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
