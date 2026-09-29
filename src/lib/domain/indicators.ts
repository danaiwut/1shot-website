// Indicator catalogue, ported from tvaccess/wf_contract.py (NAMES / MODES).
export const INDICATOR_NAMES = {
  DT: "Daytrade X",
  RP: "Reversal Patterns",
  AMD: "AMD Pro",
  AR: "Asian Range",
  OB: "Orderblock",
  SW: "Sweep Model",
  TF: "Trend Final",
  SD: "Supply and Demand",
  LV: "Period Levels",
  RC: "1SHOT RC - Confirmation",
} as const;

export type IndicatorCode = keyof typeof INDICATOR_NAMES;

export type EntryMode = "Market" | "Limit";

export const INDICATOR_MODES: Record<Exclude<IndicatorCode, "LV">, readonly EntryMode[]> = {
  DT: ["Limit"],
  RP: ["Limit"],
  AMD: ["Market", "Limit"],
  AR: ["Market", "Limit"],
  OB: ["Market"],
  RC: ["Market"],
  SW: ["Market"],
  TF: ["Limit"],
  SD: ["Limit"],
};

export function isIndicatorCode(value: string | undefined): value is IndicatorCode {
  return value !== undefined && Object.hasOwn(INDICATOR_NAMES, value);
}
