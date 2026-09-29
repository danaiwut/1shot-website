export type Role = "member" | "admin" | "owner";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  tradingview_username: string | null;
  exness_account: string | null;
  ib_verified: boolean;
  created_at: string;
}

export interface Indicator {
  code: string;
  name: string;
  family: string;
  description: string;
  modes: string[];
  telegram_room_id: string | null;
  sort: number;
  is_reference: boolean;
}

export interface IndicatorRight {
  user_id: string;
  code: string;
  expires_at: string | null;
  note: string | null;
  updated_at: string;
}

export type SetupStatus = "pending" | "entry" | "retest" | "tp" | "sl" | "cancel" | "expired" | "close" | "info";

export interface Setup {
  setup_key: string;
  code: string;
  indicator: string;
  setup_name: string;
  setup_id: string;
  mode: string | null;
  side: "BUY" | "SELL" | null;
  symbol: string;
  timeframe: string;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  opened_at: string;
  status: SetupStatus;
  last_event: string;
  exit_price: number | null;
  terminal: boolean;
  updated_at: string;
  events: number;
}

export interface SignalEvent {
  id: number;
  code: string;
  kind: SetupStatus;
  event: string;
  side: string | null;
  mode: string | null;
  entry: number | null;
  sl: number | null;
  tp: number | null;
  exit_price: number | null;
  terminal: boolean;
  observed_at: string;
  shapes: import("./domain/shapes").Shapes | null;
  reference: Record<string, unknown> | null;
}

export const isStaff = (role: Role | undefined) => role === "admin" || role === "owner";
