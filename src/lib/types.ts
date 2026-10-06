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
  /** Feature bullets for the public page. */
  points: string[];
  /** Object path in the public `indicator-images` bucket. */
  image_path: string | null;
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

export type Billing = "one_time" | "subscription";

export interface ProductPrice {
  id: string;
  product_id: string;
  billing: Billing;
  amount_satang: number;
  currency: "thb";
  interval: "month" | "year" | null;
  duration_days: number | null;
  active: boolean;
  sort: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  kind: "single" | "bundle";
  codes: string[];
  features: string[];
  active: boolean;
  featured: boolean;
  sort: number;
  product_prices?: ProductPrice[];
}

export type OrderStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";

export interface Order {
  id: string;
  user_id: string;
  product_id: string | null;
  price_id: string | null;
  product_name: string;
  codes: string[];
  billing: Billing;
  interval: string | null;
  duration_days: number | null;
  amount_satang: number;
  currency: string;
  status: OrderStatus;
  kind: "checkout" | "renewal";
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_subscription_id: string | null;
  receipt_url: string | null;
  access_until: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  product_id: string | null;
  price_id: string | null;
  product_name: string;
  codes: string[];
  status: string;
  interval: string | null;
  amount_satang: number;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
}

export type SupportKind = "rights" | "room" | "help";
export type SupportStatus = "open" | "answered" | "resolved";

export interface SupportRequest {
  id: string;
  user_id: string;
  kind: SupportKind;
  indicator_code: string | null;
  message: string;
  status: SupportStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: number;
  request_id: string;
  author_id: string | null;
  from_staff: boolean;
  body: string;
  created_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: number;
  actor_id: string | null;
  subject_id: string | null;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
}
