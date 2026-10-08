import { redirect } from "next/navigation";

// Billing now lives in the store as "ประวัติ".
export default function BillingPage() {
  redirect("/store#history");
}
