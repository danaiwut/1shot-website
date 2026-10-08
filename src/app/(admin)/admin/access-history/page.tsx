import { redirect } from "next/navigation";

/** Access history now lives on the logs page; keep the ?type= filter. */
export default async function AccessHistoryRedirect({ searchParams }: PageProps<"/admin/access-history">) {
  const { type } = await searchParams;
  redirect(`/admin/logs?tab=access${typeof type === "string" ? `&type=${encodeURIComponent(type)}` : ""}`);
}
