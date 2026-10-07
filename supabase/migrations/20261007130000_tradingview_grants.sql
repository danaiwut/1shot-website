-- Rights given by TradingView username to people who don't have a 1SHOT account yet.
-- When a member later saves that TradingView username on their profile, the grants move into
-- indicator_rights (keeping the longer expiry) and disappear from here.

create table public.tradingview_grants (
  username text not null check (username ~ '^[A-Za-z0-9_.-]{1,64}$'),
  username_key text generated always as (lower(username)) stored,
  code text not null references public.indicators (code) on update cascade on delete cascade,
  expires_at timestamptz,
  note text check (char_length(note) <= 200),
  granted_by uuid references public.profiles (id) on delete set null,
  tv_synced_at timestamptz,
  tv_synced_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (username_key, code)
);
create index tradingview_grants_granted_by on public.tradingview_grants (granted_by);
create trigger tradingview_grants_touch before update on public.tradingview_grants
  for each row execute function public.touch_updated_at();

alter table public.tradingview_grants enable row level security;
create policy "tradingview_grants: staff read" on public.tradingview_grants for select to authenticated using ((select public.is_staff()));
create policy "tradingview_grants: staff insert" on public.tradingview_grants for insert to authenticated with check ((select public.is_staff()));
create policy "tradingview_grants: staff update" on public.tradingview_grants for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "tradingview_grants: staff delete" on public.tradingview_grants for delete to authenticated using ((select public.is_staff()));

-- Member saved a TradingView username → claim grants made for it.
create function public.claim_tradingview_grants() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  g public.tradingview_grants;
begin
  if new.tradingview_username is null then return new; end if;
  for g in select * from public.tradingview_grants where username_key = lower(new.tradingview_username) for update loop
    insert into public.indicator_rights (user_id, code, expires_at, note, granted_by, tv_synced_at, tv_synced_expires)
    values (new.id, g.code, g.expires_at, coalesce(g.note, 'ให้สิทธิ์ผ่านชื่อ TradingView'), g.granted_by, g.tv_synced_at, g.tv_synced_expires)
    on conflict (user_id, code) do update set
      -- keep whichever lasts longer; null = lifetime wins
      expires_at = case
        when public.indicator_rights.expires_at is null or excluded.expires_at is null then null
        else greatest(public.indicator_rights.expires_at, excluded.expires_at) end,
      note = excluded.note;
    delete from public.tradingview_grants where username_key = g.username_key and code = g.code;
  end loop;
  return new;
end;
$$;
revoke execute on function public.claim_tradingview_grants() from public, anon, authenticated;

create trigger profiles_claim_tradingview_grants
  after insert or update of tradingview_username on public.profiles
  for each row when (new.tradingview_username is not null)
  execute function public.claim_tradingview_grants();
