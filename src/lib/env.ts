import { isMockMode } from "./mock/mode";

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

export const publicEnv = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseKey: () =>
    required(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  siteUrl: () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const serverEnv = {
  supabaseSecretKey: () =>
    required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  webhookSecret: () => process.env.TRADINGVIEW_WEBHOOK_SECRET ?? (isMockMode() ? "demo-secret" : ""),
  telegramToken: () => process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramBotUsername: () => process.env.TELEGRAM_BOT_USERNAME ?? "",
  telegramWebhookSecret: () => process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  stripeSecretKey: () => process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET ?? "",
};

/** Real Supabase or the in-memory mockup: either way the auth/data calls work. */
export const hasBackend = () => isSupabaseConfigured() || isMockMode();

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
