import { ExternalLink } from "lucide-react";
import { CARD, EmptyLine, Section, Status } from "@/components/app/kit";
import { requireStaff } from "@/lib/auth";
import { BLOG_PAGE, loadBlogPosts } from "@/lib/blog";
import { fmtDateTime } from "@/lib/format";
import { AddPostForm, PostControls } from "./blog-forms";

export async function BlogTab() {
  const { supabase } = await requireStaff();
  const posts = await loadBlogPosts(supabase, 100);
  const shown = posts.filter((p) => p.active).length;
  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold tracking-tight">เพิ่มโพสต์</h2>
          <p className="mt-0.5 text-sm text-muted">วางลิงก์ › ดึงตัวอย่าง › ตรวจการ์ดทางขวา › เพิ่มโพสต์</p>
        </div>
        <AddPostForm defaultPage={BLOG_PAGE.name} avatar={BLOG_PAGE.avatar} />
      </section>

      <Section title="โพสต์ทั้งหมด" description={`${posts.length} โพสต์ · แสดงบนหน้าแรก ${shown} · ใหม่สุดอยู่บน`} bare>
        {posts.length ? (
          <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
            {posts.map((p) => (
              <li key={p.id} className={`${CARD} flex gap-4 p-4`}>
                {p.images[0]
                  // eslint-disable-next-line @next/next/no-img-element -- stored blog image
                  ? <img src={p.images[0]} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
                  : <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-panel-3 text-xs text-muted">ไม่มีรูป</span>}
                <div className="flex min-w-0 flex-1 flex-col">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-1.5 font-bold hover:text-accent">
                    <span className="line-clamp-2 min-w-0 flex-1 group-hover:underline">{p.body || p.url}</span>
                    <ExternalLink aria-hidden className="mt-1 size-3.5 shrink-0 text-faint" />
                    <span className="sr-only"> (เปิดโพสต์บน Facebook)</span>
                  </a>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <Status tone={p.active ? "good" : "neutral"}>{p.active ? "แสดงอยู่" : "ซ่อน"}</Status>
                    <span className="num">{fmtDateTime(p.posted_at)}</span>
                    <span>รูป {p.images.length}</span>
                  </p>
                  <div className="mt-auto flex justify-end pt-2"><PostControls id={p.id} active={p.active} /></div>
                </div>
              </li>
            ))}
          </ul>
        ) : <div className={CARD}><EmptyLine>ยังไม่มีโพสต์ เพิ่มโพสต์แรกด้านบน</EmptyLine></div>}
      </Section>
    </div>
  );
}
