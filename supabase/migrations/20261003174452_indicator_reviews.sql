-- Indicator reviews: star rating + comment, only from members who actually bought the indicator.
-- "Bought" = a paid (not refunded) order whose codes include the indicator. Free IB access does not count.

create function public.has_purchased(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.orders o
    where o.user_id = (select auth.uid()) and o.status = 'paid' and p_code = any (o.codes)
  );
$$;
revoke execute on function public.has_purchased(text) from public, anon;
grant execute on function public.has_purchased(text) to authenticated;

create table public.indicator_reviews (
  indicator_code text not null references public.indicators (code) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '' check (char_length(body) <= 1000),
  -- Public display name, snapshotted so other members' profiles stay private.
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (indicator_code, user_id)
);
create index indicator_reviews_user_id on public.indicator_reviews (user_id);
create index indicator_reviews_recent on public.indicator_reviews (indicator_code, created_at desc);

-- Fills author_name and pins identity columns; clients cannot pick someone else's name.
create function public.prepare_review() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.profiles;
begin
  select * into p from public.profiles where id = new.user_id;
  new.author_name := coalesce(nullif(trim(p.display_name), ''), left(split_part(p.email, '@', 1), 3) || '***');
  if tg_op = 'UPDATE' then
    new.indicator_code := old.indicator_code;
    new.user_id := old.user_id;
    new.created_at := old.created_at;
    new.updated_at := now();
  end if;
  return new;
end;
$$;
revoke execute on function public.prepare_review() from public, anon, authenticated;
create trigger indicator_reviews_prepare before insert or update on public.indicator_reviews
  for each row execute function public.prepare_review();

alter table public.indicator_reviews enable row level security;
create policy "reviews: public read" on public.indicator_reviews for select to anon, authenticated using (true);
create policy "reviews: buyers insert own" on public.indicator_reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and public.has_purchased(indicator_code));
create policy "reviews: buyers update own" on public.indicator_reviews for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.has_purchased(indicator_code));
create policy "reviews: delete own or staff" on public.indicator_reviews for delete to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
