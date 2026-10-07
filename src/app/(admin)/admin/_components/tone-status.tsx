import type { ReactNode } from "react";
import { Status } from "@/components/app/kit";

type BadgeTone = "neutral" | "brand" | "buy" | "sell" | "info";
const map = { neutral: "neutral", info: "neutral", brand: "warn", buy: "good", sell: "bad" } as const;

/** Status dot + words for the label/tone pairs in ORDER_STATUS / SUB_STATUS. */
export function ToneStatus({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return <Status tone={map[tone]}>{children}</Status>;
}
