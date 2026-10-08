import { redirect } from "next/navigation";

/** Announcements now live on the content page. */
export default function AnnouncementsRedirect() {
  redirect("/admin/content?tab=announcements");
}
