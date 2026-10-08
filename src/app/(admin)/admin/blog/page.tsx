import { redirect } from "next/navigation";

/** The Facebook blog now lives on the content page. */
export default function BlogRedirect() {
  redirect("/admin/content?tab=blog");
}
