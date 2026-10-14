"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { defaultInstallmentPlan, refundOrder } from "@/lib/store/orders";
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

/** Customer stopped paying installments: revoke the access without a refund (first installment is forfeited). */
export async function forfeitInstallmentPlan(planId: string): Promise<{ error?: string }> {
  await requireStaff();
  try {
    await defaultInstallmentPlan(z.uuid().parse(planId));
  } catch (err) {
    console.error("forfeit installment plan failed", planId, err);
    return { error: err instanceof StoreError ? err.message : "ถอนสิทธิ์ไม่สำเร็จ" };
  }
  revalidatePath("/admin", "layout");
  return {};
}
