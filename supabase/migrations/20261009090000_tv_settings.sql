-- Server-only settings (e.g. the TradingView owner's session cookie used for
-- automatic invite-only access). Service role only: RLS is on with no policies,
-- so anon/authenticated clients — including staff browsers — can never read it.
-- Reads/writes go through server actions with the service role (see admin/settings).
create table public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);
alter table public.app_settings enable row level security;
comment on table public.app_settings is 'Server-only settings. Keys: tradingview.sessionid, tradingview.sessionid_sign. Never readable by clients.';
