"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { refundOrder } from "@/lib/store/orders";
import { StoreError } from "@/lib/store/stripe";

/** Full refund in Stripe + automatic removal of the access the order granted. */
export async function refund(orderId: string): Promise<{ error?: string }> {
  await requireStaff();
  try {
    await refundOrder(z.uuid().parse(orderId));
  } catch (err) {
    console.error("refund failed", orderId, err);
    return { error: err instanceof StoreError ? err.message : "คืนเงินไม่สำเร็จ ลองคืนจากหน้า Stripe แทน" };
  }
  revalidatePath("/admin", "layout");
  return {};
}
