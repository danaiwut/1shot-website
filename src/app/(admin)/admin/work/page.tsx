import { redirect } from "next/navigation";

/** The work queue now lives on the admin home page. */
export default function WorkCenterPage() {
  redirect("/admin");
}
