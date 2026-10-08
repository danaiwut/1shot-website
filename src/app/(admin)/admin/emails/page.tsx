import { redirect } from "next/navigation";

/** Sent emails now live on the logs page. */
export default function EmailsRedirect() {
  redirect("/admin/logs?tab=emails");
}
