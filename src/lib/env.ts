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
  webhookSecret: () => process.env.TRADINGVIEW_WEBHOOK_SECRET ?? "",
  telegramToken: () => process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramBotUsername: () => process.env.TELEGRAM_BOT_USERNAME ?? "",
  telegramWebhookSecret: () => process.env.TELEGRAM_WEBHOOK_SECRET ?? "",
  stripeSecretKey: () => process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: () => process.env.STRIPE_WEBHOOK_SECRET ?? "",
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  emailFrom: () => process.env.EMAIL_FROM ?? "",
  emailReplyTo: () => process.env.EMAIL_REPLY_TO ?? "",
  /** Google OAuth client (Web application) — Google redirects straight back to {SITE_URL}/auth/google/callback. */
  googleClientId: () => process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: () => process.env.GOOGLE_CLIENT_SECRET ?? "",
  /** Comma-separated emails that are made owner automatically (first admin setup). */
  ownerEmails: () => (process.env.OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
};

export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
