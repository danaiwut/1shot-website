import { redirect } from "next/navigation";

/** TradingView webhook receipts now live on the logs page. */
export default function WebhooksRedirect() {
  redirect("/admin/logs?tab=webhooks");
}
