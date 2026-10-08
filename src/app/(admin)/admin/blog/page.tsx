import { EmptyLine, Section, SettingsSection, Status } from "@/components/app/kit";
import { PageHeader } from "@/components/app/page-header";
import { requireStaff } from "@/lib/auth";
import { BLOG_PAGE, loadBlogPosts } from "@/lib/blog";
import { fmtDateTime } from "@/lib/format";
import { AddPostForm, PostControls } from "./forms";

export const metadata = { title: "บล็อกข่าวสาร" };

export default async function BlogAdminPage() {
  const { supabase } = await requireStaff();
  const posts = await loadBlogPosts(supabase, 100);
  return (
    <>
      <PageHeader title="บล็อกข่าวสาร" description="วางลิงก์โพสต์ Facebook แล้วจะขึ้นเป็นการ์ดเลื่อนบนหน้าแรก กดการ์ดแล้วไปที่โพสต์บน Facebook" />
      <div className="max-w-4xl space-y-10">
        <SettingsSection title="เพิ่มโพสต์" description="1) วางลิงก์ 2) กด “ดึงตัวอย่าง” 3) ตรวจข้อความกับรูป 4) กดเพิ่มโพสต์">
          <AddPostForm defaultPage={BLOG_PAGE.name} />
        </SettingsSection>
        <Section title={`โพสต์ทั้งหมด (${posts.length})`} description="ใหม่สุดอยู่บน">
          {posts.length ? (
            <ul className="divide-y divide-line">
              {posts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-5">
                  {p.images[0]
                    // eslint-disable-next-line @next/next/no-img-element -- stored blog image
                    ? <img src={p.images[0]} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                    : <span className="size-14 shrink-0 rounded-lg bg-panel-3" />}
                  <span className="min-w-0 flex-1">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="line-clamp-1 text-sm font-medium hover:text-accent hover:underline">{p.body || p.url}</a>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                      {fmtDateTime(p.posted_at)} · รูป {p.images.length}
                      <Status tone={p.active ? "good" : "neutral"}>{p.active ? "แสดงอยู่" : "ซ่อน"}</Status>
                    </span>
                  </span>
                  <PostControls id={p.id} active={p.active} />
                </li>
              ))}
            </ul>
          ) : <EmptyLine>ยังไม่มีโพสต์ เพิ่มโพสต์แรกด้านบน</EmptyLine>}
        </Section>
      </div>
    </>
  );
}
