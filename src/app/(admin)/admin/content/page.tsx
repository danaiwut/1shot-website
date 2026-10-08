import { PageHeader } from "@/components/app/page-header";
import { AnnouncementsTab } from "./announcements-tab";
import { BlogTab } from "./blog-tab";
import { BriefTab, NewsTab } from "./brief-tab";
import { ContentTabs, contentTab } from "./content-tabs";

export async function generateMetadata({ searchParams }: PageProps<"/admin/content">) {
  return { title: `${contentTab((await searchParams).tab).label} · เนื้อหา` };
}

export default async function ContentPage({ searchParams }: PageProps<"/admin/content">) {
  const { tab, edit } = await searchParams;
  const t = contentTab(tab);
  const id = typeof edit === "string" ? edit : undefined;
  return (
    <>
      <PageHeader title="เนื้อหา" description={t.line} />
      <ContentTabs on={t.id} />
      {t.id === "brief" ? <BriefTab edit={id} />
        : t.id === "news" ? <NewsTab />
        : t.id === "announcements" ? <AnnouncementsTab edit={id} />
        : <BlogTab />}
    </>
  );
}
