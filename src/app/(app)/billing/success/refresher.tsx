"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-checks the order until the Stripe webhook has marked it paid (PromptPay can take a little while). */
export function Refresher() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 2500);
    const stop = setTimeout(() => clearInterval(t), 5 * 60 * 1000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [router]);
  return null;
}
