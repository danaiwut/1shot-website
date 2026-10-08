import { Globe } from "lucide-react";
import { cx } from "@/components/ui";
import { BLOG_PAGE, type PublicBlogPost } from "@/lib/blog";

const when = (iso: string) => {
  const d = new Date(iso);
  const day = d.toLocaleDateString("th-TH", { day: "numeric", month: "long", timeZone: "Asia/Bangkok" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok" });
  return `${day} เวลา ${time} น.`;
};

/**
 * Homepage "BLOG": the page's Facebook posts as cards that drift right → left in an endless loop.
 * Hover / keyboard focus pauses it, so does the "หยุดเลื่อน" switch (WCAG 2.2.2); without motion it's a plain scroller.
 */
export function BlogSection({ posts }: { posts: PublicBlogPost[] }) {
  if (!posts.length) return null;
  const seconds = Math.max(30, posts.length * 9);
  return (
    <section id="blog" aria-labelledby="blog-title" className="scroll-mt-18 overflow-hidden border-t border-line bg-panel-2">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 pt-20 sm:px-6 sm:pt-24">
        <div>
          <p className="text-sm font-bold tracking-[0.18em] text-accent uppercase">Blog</p>
          <h2 id="blog-title" className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">ข่าวสารจาก 1SHOT<span className="text-brand dark:text-[#ff2e43]">.</span></h2>
          <p className="mt-2 text-base text-muted">อัปเดตล่าสุดจากเพจ Facebook ของเรา กดการ์ดเพื่ออ่านต่อ</p>
        </div>
      </div>

      <div className="relative mt-10 pb-20 sm:pb-24">
        <input type="checkbox" id="blog-pause" className="peer sr-only" />
        <div className="blog-viewport [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
          <ul className="blog-track" style={{ ["--blog-duration" as string]: `${seconds}s` }}>
            {[0, 1].map((copy) => posts.map((p) => (
              <li key={`${copy}-${p.id}`} aria-hidden={copy === 1 || undefined} className={cx("blog-item", copy === 1 && "blog-copy")}>
                <PostCard post={p} hidden={copy === 1} />
              </li>
            )))}
          </ul>
        </div>
        <label
          htmlFor="blog-pause"
          className="mx-auto mt-6 flex min-h-11 w-fit cursor-pointer items-center rounded-full px-4 text-sm font-medium text-muted hover:text-fg peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 [&_.on]:hidden peer-checked:[&_.on]:inline peer-checked:[&_.off]:hidden"
        >
          <span className="off">หยุดเลื่อน</span><span className="on">เลื่อนต่อ</span>
        </label>
      </div>
    </section>
  );
}

function PostCard({ post: p, hidden }: { post: PublicBlogPost; hidden: boolean }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      tabIndex={hidden ? -1 : undefined}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_20px_50px_-35px_rgb(0_0_0/0.5)] transition-colors hover:border-brand/50"
    >
      <div className="flex items-center gap-3 px-5 pt-5">
        <span className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- page avatar */}
          <img src={BLOG_PAGE.avatar} alt="" className="size-12 rounded-full bg-ink object-cover object-top ring-2 ring-[#1877f2]" />
          <span aria-hidden className="absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-panel bg-[#31a24c]" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold">{p.page_name || BLOG_PAGE.name}</span>
          <span className="flex items-center gap-1.5 text-sm text-muted">{when(p.posted_at)} <Globe aria-hidden className="size-3.5" /></span>
        </span>
      </div>
      {p.body && <p className="mt-3 line-clamp-3 px-5 text-[0.95rem] leading-relaxed whitespace-pre-line">{p.body}</p>}
      <Collage images={p.images} />
      <span className="sr-only"> (เปิดโพสต์บน Facebook ในแท็บใหม่)</span>
    </a>
  );
}

/** Facebook-style photo grid: 1 big, 2 side by side, or 2 on top + 3 below with "+N". */
function Collage({ images }: { images: string[] }) {
  if (!images.length) return <div className="mt-4" />;
  const img = (src: string, className?: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- stored blog image
    <img key={src} src={src} alt="" loading="lazy" className={cx("size-full object-cover", className)} />
  );
  if (images.length === 1) return <div className="mt-4 aspect-[16/10] bg-line">{img(images[0])}</div>;
  if (images.length === 2) return <div className="mt-4 grid aspect-[16/10] grid-cols-2 gap-0.5 bg-line">{images.map((s) => img(s))}</div>;
  const rest = images.length - 5;
  return (
    <div className="mt-4 grid gap-0.5 bg-line">
      <div className="grid h-44 grid-cols-2 gap-0.5">{images.slice(0, 2).map((s) => img(s))}</div>
      <div className="grid h-28 grid-cols-3 gap-0.5">
        {images.slice(2, 5).map((s, i) => (
          <div key={s} className="relative">
            {img(s)}
            {i === 2 && rest > 0 && <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-bold text-white">+{rest}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
