import { PageHeader } from "@/components/app/page-header";
import { AccessTab } from "./access-tab";
import { EmailsTab } from "./emails-tab";
import { LogsTabs, logTab } from "./logs-tabs";
import { one } from "@/components/app/toolbar";
import { WebhooksTab } from "./webhooks-tab";

export async function generateMetadata({ searchParams }: PageProps<"/admin/logs">) {
  return { title: `${logTab((await searchParams).tab).label} · บันทึกระบบ` };
}

export default async function LogsPage({ searchParams }: PageProps<"/admin/logs">) {
  const { tab, type, status, result, q } = await searchParams;
  const t = logTab(tab);
  return (
    <>
      <PageHeader title="บันทึกระบบ" description={t.line} />
      <LogsTabs on={t.id} />
      {t.id === "emails" ? <EmailsTab status={one(status)} q={one(q)} />
        : t.id === "webhooks" ? <WebhooksTab result={one(result)} />
        : <AccessTab type={type} q={one(q)} />}
    </>
  );
}
