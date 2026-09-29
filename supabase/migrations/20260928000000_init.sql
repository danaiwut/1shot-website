-- 1SHOT on Supabase — initial schema.
-- Replaces the legacy SQLite/JSON stores (tv_users.json, tv_rights.json, web_telegram.sqlite3, chart_events).

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('member', 'admin', 'owner');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  role public.member_role not null default 'member',
  tradingview_username text,
  exness_account text,
  -- Set by staff after checking the account sits under the IB (replaces exness_link affiliation check).
  ib_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tradingview_username_format check (tradingview_username is null or tradingview_username ~ '^[A-Za-z0-9_.-]{1,64}$'),
  constraint exness_account_format check (exness_account is null or exness_account ~ '^[0-9]{4,20}$')
);

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('admin', 'owner'));
$$;

create function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'owner');
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'display_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Members may edit only their own contact fields; role / ib_verified are staff-only.
create function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) = 'service_role' then
    return new;
  end if;
  if new.id <> old.id or new.email <> old.email then
    raise exception 'ไม่สามารถแก้ไขตัวตนบัญชี';
  end if;
  if new.role <> old.role and not public.is_owner() then
    raise exception 'เฉพาะเจ้าของระบบเท่านั้นที่เปลี่ยนบทบาทได้';
  end if;
  if new.ib_verified <> old.ib_verified and not public.is_staff() then
    raise exception 'เฉพาะแอดมินเท่านั้นที่ยืนยัน IB ได้';
  end if;
  -- Changing the Exness account invalidates a previous IB verification.
  if new.exness_account is distinct from old.exness_account and not public.is_staff() then
    new.ib_verified = false;
  end if;
  return new;
end;
$$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;

create policy "profiles: read own or staff" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_staff());
create policy "profiles: update own or staff" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_staff())
  with check (id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- Indicators & access rights (replaces tv_rights.json / gate_rooms)
-- ---------------------------------------------------------------------------
create table public.indicators (
  code text primary key,
  name text not null,
  family text not null,
  description text not null default '',
  modes text[] not null default '{}',
  -- Telegram room gated by this indicator (legacy tv_config.gate_rooms).
  telegram_room_id text,
  sort int not null default 0,
  is_reference boolean not null default false
);

insert into public.indicators (code, name, family, description, modes, sort, is_reference) values
  ('DT',  'Daytrade X',              'SMC', 'CHoCH/BOS พร้อมโซนเข้าแบบ Limit สำหรับเทรดระหว่างวัน', '{Limit}', 10, false),
  ('RP',  'Reversal Patterns',       '1SHOT', 'รูปแบบกลับตัว สร้าง → Retest → TP/SL', '{Limit}', 20, false),
  ('AMD', 'AMD Pro',                 'ICT', 'Accumulation · Manipulation · Distribution', '{Market,Limit}', 30, false),
  ('AR',  'Asian Range',             'ICT', 'กรอบราคาช่วงเอเชียและการกวาดสภาพคล่อง', '{Market,Limit}', 40, false),
  ('OB',  'Orderblock',              'ICT', 'Orderblock พร้อมยืนยันเข้าแบบ Market', '{Market}', 50, false),
  ('SW',  'Sweep Model',             'ICT', 'กวาด Liquidity แล้วเข้าตาม CISD', '{Market}', 60, false),
  ('TF',  'Trend Final',             'SnD', 'ตามเทรนด์ด้วยโซน Supply/Demand', '{Limit}', 70, false),
  ('SD',  'Supply and Demand',       'SnD', 'โซน Supply/Demand พร้อมเป้า TP หลายระดับ (R)', '{Limit}', 80, false),
  ('RC',  '1SHOT RC - Confirmation', '1SHOT', 'สัญญาณยืนยันเข้าแบบ Market', '{Market}', 90, false),
  ('LV',  'Period Levels',           '1SHOT', 'ระดับ PDH/PDL · PWH/PWL · PMH/PML และราคาเปิดรอบ', '{}', 100, true);

alter table public.indicators enable row level security;
create policy "indicators: public read" on public.indicators for select to anon, authenticated using (true);
create policy "indicators: staff write" on public.indicators for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create table public.indicator_rights (
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null references public.indicators (code) on delete cascade,
  -- null = lifetime access
  expires_at timestamptz,
  note text,
  granted_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (user_id, code)
);

create trigger indicator_rights_touch before update on public.indicator_rights
  for each row execute function public.touch_updated_at();

alter table public.indicator_rights enable row level security;
create policy "rights: read own or staff" on public.indicator_rights for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "rights: staff write" on public.indicator_rights for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create function public.has_indicator(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_staff()
    or exists (
      select 1 from public.indicators i where i.code = p_code and i.is_reference
    )
    or exists (
      select 1 from public.indicator_rights r
      where r.user_id = (select auth.uid()) and r.code = p_code
        and (r.expires_at is null or r.expires_at > now())
    );
$$;

-- ---------------------------------------------------------------------------
-- Signals (replaces chart_events + wf_receipts)
-- ---------------------------------------------------------------------------
create table public.signal_events (
  id bigint generated always as identity primary key,
  code text not null references public.indicators (code),
  indicator text not null,
  kind text not null check (kind in ('pending','entry','retest','tp','sl','cancel','expired','close','info')),
  event text not null,
  mode text,
  side text,
  symbol text not null,
  feed_symbol text not null,
  timeframe text not null,
  version text not null,
  setup_id text not null,
  event_id text not null,
  setup_key text not null,
  setup_name text not null,
  entry numeric,
  sl numeric,
  tp numeric,
  exit_price numeric,
  terminal boolean not null,
  identity_status text,
  observed_at timestamptz not null,
  bar_time timestamptz not null,
  shapes jsonb,
  reference jsonb,
  -- Canonical fields used to detect a replayed Event ID carrying different data.
  body jsonb not null,
  received_at timestamptz not null default now(),
  unique (code, event_id)
);

create index signal_events_setup_key on public.signal_events (setup_key, observed_at);
create index signal_events_observed on public.signal_events (observed_at desc);

alter table public.signal_events enable row level security;
create policy "signals: members with right" on public.signal_events for select to authenticated
  using (public.has_indicator(code));

-- One row per setup: opening event + latest state.
create view public.setups with (security_invoker = true) as
select
  first.setup_key,
  first.code,
  first.indicator,
  first.setup_name,
  first.setup_id,
  first.mode,
  first.side,
  first.symbol,
  first.timeframe,
  first.entry,
  first.sl,
  first.tp,
  first.observed_at as opened_at,
  last.kind as status,
  last.event as last_event,
  last.exit_price,
  last.terminal,
  last.observed_at as updated_at,
  counts.events
from (
  select distinct on (setup_key) * from public.signal_events where kind <> 'info'
  order by setup_key, observed_at, id
) first
join lateral (
  select * from public.signal_events e where e.setup_key = first.setup_key
  order by e.observed_at desc, e.id desc limit 1
) last on true
join lateral (
  select count(*)::int as events from public.signal_events e where e.setup_key = first.setup_key
) counts on true;

-- Atomic, idempotent batch ingestion (port of wf_contract.record). Service role only.
create function public.ingest_signal_events(p_events jsonb) returns int
language plpgsql security definer set search_path = '' as $$
declare
  e jsonb;
  old_body jsonb;
  prior record;
  inserted int := 0;
begin
  for e in select * from jsonb_array_elements(p_events) loop
    select body into old_body from public.signal_events
      where code = e ->> 'code' and event_id = e ->> 'event_id';
    if found then
      if old_body <> e -> 'body' then
        raise exception 'Event ID ซ้ำแต่ข้อมูลต่างกัน' using errcode = 'P0409';
      end if;
      continue;
    end if;

    if e ->> 'kind' <> 'info' then
      select mode, side, entry, sl into prior from public.signal_events
        where setup_key = e ->> 'setup_key' order by id limit 1;
      if found and (prior.mode is distinct from e ->> 'mode' or prior.side is distinct from e ->> 'side'
          or prior.entry is distinct from (e ->> 'entry')::numeric or prior.sl is distinct from (e ->> 'sl')::numeric) then
        raise exception 'Setup ID มีโหมดหรือฝั่งขัดกัน' using errcode = 'P0409';
      end if;
    end if;

    insert into public.signal_events (
      code, indicator, kind, event, mode, side, symbol, feed_symbol, timeframe, version,
      setup_id, event_id, setup_key, setup_name, entry, sl, tp, exit_price, terminal,
      identity_status, observed_at, bar_time, shapes, reference, body
    ) values (
      e ->> 'code', e ->> 'indicator', e ->> 'kind', e ->> 'event', e ->> 'mode', e ->> 'side',
      e ->> 'symbol', e ->> 'feed_symbol', e ->> 'timeframe', e ->> 'version',
      e ->> 'setup_id', e ->> 'event_id', e ->> 'setup_key', e ->> 'setup_name',
      (e ->> 'entry')::numeric, (e ->> 'sl')::numeric, (e ->> 'tp')::numeric, (e ->> 'exit_price')::numeric,
      (e ->> 'terminal')::boolean, e ->> 'identity_status',
      to_timestamp((e ->> 'observed_at')::double precision), to_timestamp((e ->> 'bar_time')::double precision),
      e -> 'shapes', e -> 'reference', e -> 'body'
    );
    inserted := inserted + 1;
  end loop;
  return inserted;
end;
$$;

revoke execute on function public.ingest_signal_events(jsonb) from public, anon, authenticated;

create table public.webhook_receipts (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  ok boolean not null,
  inserted int not null default 0,
  error text,
  excerpt text
);
alter table public.webhook_receipts enable row level security;
create policy "webhook receipts: staff read" on public.webhook_receipts for select to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Telegram pairing (port of tv_webbridge)
-- ---------------------------------------------------------------------------
create table public.telegram_link_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  digest text not null unique,
  expires_at timestamptz not null,
  tg_uid text,
  tg_name text,
  tg_username text,
  created_at timestamptz not null default now()
);
alter table public.telegram_link_tokens enable row level security;
create policy "tg tokens: read own" on public.telegram_link_tokens for select to authenticated
  using (user_id = (select auth.uid()));

create table public.telegram_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tg_uid text not null unique,
  tg_name text,
  tg_username text,
  linked_at timestamptz not null default now()
);
alter table public.telegram_links enable row level security;
create policy "tg links: read own or staff" on public.telegram_links for select to authenticated
  using (user_id = (select auth.uid()) or public.is_staff());
create policy "tg links: staff delete" on public.telegram_links for delete to authenticated
  using (public.is_staff());

create table public.telegram_invites (
  invite_url text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  tg_uid text not null,
  room_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.telegram_invites enable row level security;
-- No client policies: invites are managed by the server only.

-- ---------------------------------------------------------------------------
-- Market context (replaces tv_world.json / tv_morning_brief.json)
-- ---------------------------------------------------------------------------
create table public.news_items (
  id bigint generated always as identity primary key,
  source text not null,
  title text not null,
  title_th text,
  link text not null unique,
  gold_impact text,
  published_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index news_items_published on public.news_items (published_at desc);
alter table public.news_items enable row level security;
create policy "news: members read" on public.news_items for select to authenticated using (true);

create table public.daily_briefs (
  brief_date date primary key,
  facts text not null,
  story text not null,
  created_at timestamptz not null default now()
);
alter table public.daily_briefs enable row level security;
create policy "briefs: members read" on public.daily_briefs for select to authenticated using (true);

-- Live feed for the signals page.
alter publication supabase_realtime add table public.signal_events;
