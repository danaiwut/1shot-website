-- 1) Exness lot volumes (synced from the Exness partner API), 2) TradingView activation tracking for rights,
-- 3) monthly promotions shown on the homepage.

-- ---------------------------------------------------------------------------
-- Exness lots: one row per trading account per day. Written only by the server (service role).
-- ---------------------------------------------------------------------------
create table public.exness_lots (
  account text not null check (account ~ '^[0-9]{4,20}$'),
  day date not null,
  lots numeric(14, 2) not null default 0 check (lots >= 0),
  synced_at timestamptz not null default now(),
  primary key (account, day)
);
create index exness_lots_day on public.exness_lots (day desc);

alter table public.exness_lots enable row level security;
create policy "lots: staff or own account" on public.exness_lots for select to authenticated
  using ((select public.is_staff()) or exists (
    select 1 from public.profiles p where p.id = (select auth.uid()) and p.exness_account = exness_lots.account
  ));

create table public.exness_sync_runs (
  id bigint generated always as identity primary key,
  trigger text not null check (trigger in ('cron', 'manual')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ok boolean,
  rows integer not null default 0,
  error text
);
create index exness_sync_runs_started on public.exness_sync_runs (started_at desc);
alter table public.exness_sync_runs enable row level security;
create policy "sync runs: staff read" on public.exness_sync_runs for select to authenticated using ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- TradingView activation: TradingView has no API, so staff add the user to the invite-only script by hand.
-- A right needs (re)activation when it was never synced or its expiry changed since the last sync.
-- ---------------------------------------------------------------------------
alter table public.indicator_rights
  add column tv_synced_at timestamptz,
  add column tv_synced_expires timestamptz;
comment on column public.indicator_rights.tv_synced_at is 'When staff last mirrored this right in TradingView (null = never).';
comment on column public.indicator_rights.tv_synced_expires is 'expires_at value at that time; differs from expires_at when TradingView needs updating.';

-- ---------------------------------------------------------------------------
-- Promotions ("โปรโมชันประจำเดือน")
-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 600),
  badge text check (char_length(badge) <= 40),
  code text check (code ~ '^[A-Za-z0-9_-]{2,40}$'),
  cta_label text check (char_length(cta_label) <= 40),
  cta_href text check (cta_href ~ '^/[^/]' or cta_href ~ '^https://'),
  starts_on date not null,
  ends_on date not null,
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promotions_dates check (ends_on >= starts_on)
);
create index promotions_window on public.promotions (active, starts_on desc, ends_on);
create index promotions_created_by on public.promotions (created_by);
create trigger promotions_touch before update on public.promotions
  for each row execute function public.touch_updated_at();

alter table public.promotions enable row level security;
-- Visitors see running promotions (Bangkok date); staff see everything. Two policies because
-- anon may not execute is_staff().
create policy "promotions: public read running" on public.promotions for select to anon, authenticated
  using (active and (now() at time zone 'Asia/Bangkok')::date between starts_on and ends_on);
create policy "promotions: staff read all" on public.promotions for select to authenticated using ((select public.is_staff()));
create policy "promotions: staff insert" on public.promotions for insert to authenticated with check ((select public.is_staff()));
create policy "promotions: staff update" on public.promotions for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "promotions: staff delete" on public.promotions for delete to authenticated using ((select public.is_staff()));
