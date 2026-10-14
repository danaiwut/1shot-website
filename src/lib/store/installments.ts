import type { createClient } from "../supabase/server";
import type { InstallmentPlan, Order } from "../types";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Splits a price into a fixed first installment and `count - 1` equal remaining installments
 * (any rounding remainder lands on the last one, in satang). Pure, so it's safe to call from
 * both the server (creating the real amounts) and the client (previewing them at checkout).
 */
export function splitInstallments(totalSatang: number, firstSatang: number, count: number): number[] {
  const restTotal = totalSatang - firstSatang;
  const restCount = count - 1;
  const base = Math.floor(restTotal / restCount);
  const amounts = [firstSatang];
  for (let i = 0; i < restCount; i++) amounts.push(i === restCount - 1 ? restTotal - base * (restCount - 1) : base);
  return amounts;
}

export type InstallmentPlanView = InstallmentPlan & {
  amounts: number[];
  paidCount: number;
  /** Amount due for the next unpaid installment, or null when the plan is no longer active. */
  nextAmountSatang: number | null;
};

/** The viewer's installment plans with payment progress, for /store "ประวัติ". */
export async function loadInstallmentPlans(supabase: Client, userId: string): Promise<InstallmentPlanView[]> {
  const [{ data: plans }, { data: orders }] = await Promise.all([
    supabase.from("installment_plans").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("orders").select("installment_plan_id, installment_seq, status").eq("user_id", userId).eq("kind", "installment"),
  ]);
  const rows = (orders ?? []) as Pick<Order, "installment_plan_id" | "installment_seq" | "status">[];
  return ((plans ?? []) as InstallmentPlan[]).map((p) => {
    const paidCount = rows.filter((r) => r.installment_plan_id === p.id && r.status === "paid").length;
    const amounts = splitInstallments(p.total_amount_satang, p.first_amount_satang, p.installment_count);
    return { ...p, amounts, paidCount, nextAmountSatang: p.status === "active" && paidCount < p.installment_count ? amounts[paidCount] : null };
  });
}
