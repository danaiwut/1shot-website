-- Self-serve installment plans, paid through our own checkout (never Stripe's native
-- installments/subscriptions): the admin sets, per price, how many installments it can be
-- split into and a fixed first-installment amount; the remaining installments split the
-- rest of the price evenly. Each installment is its own one-time Stripe Checkout Session.
--
-- Full access is granted as soon as the first installment is paid (grant_order already does
-- this: a lifetime price has duration_days = null, so the normal grant is lifetime regardless
-- of how much of the price has been collected). The customer explicitly agrees at checkout
-- that if a later installment goes unpaid, access is revoked immediately; the first
-- installment is forfeited, not refunded, so this does not go through refund_order/Stripe.

alter table public.product_prices
  add column max_installments int check (max_installments between 2 and 12),
  add column installment_first_amount_satang int check (installment_first_amount_satang >= 1000),
  add constraint product_prices_installment_pair
    check ((max_installments is null) = (installment_first_amount_satang is null)),
  add constraint product_prices_installment_one_time
    check (max_installments is null or billing = 'one_time'),
  -- Installments only make sense for lifetime prices: a duration-limited grant's expiry is
  -- computed once at the first payment, so a later default can't cleanly claw back "some" of it.
  add constraint product_prices_installment_lifetime
    check (max_installments is null or duration_days is null);

alter table public.orders drop constraint orders_kind_check;
alter table public.orders add constraint orders_kind_check check (kind in ('checkout', 'renewal', 'installment'));
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded', 'revoked'));

create table public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  price_id uuid references public.product_prices (id) on delete set null,
  -- Snapshot at purchase time, so history survives catalogue edits.
  product_name text not null,
  codes text[] not null,
  total_amount_satang int not null,
  installment_count int not null check (installment_count between 2 and 12),
  first_amount_satang int not null,
  status text not null default 'active' check (status in ('active', 'completed', 'defaulted', 'canceled')),
  consent_accepted_at timestamptz not null default now(),
  -- The order for installment #1 (always lifetime-granting); used to revoke access on default.
  anchor_order_id uuid references public.orders (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index installment_plans_user_id on public.installment_plans (user_id, created_at desc);
create trigger installment_plans_touch before update on public.installment_plans
  for each row execute function public.touch_updated_at();

alter table public.orders
  add column installment_plan_id uuid references public.installment_plans (id) on delete set null,
  add column installment_seq int check (installment_seq between 1 and 12),
  add constraint orders_installment_pair
    check ((kind = 'installment') = (installment_plan_id is not null and installment_seq is not null));
create index orders_installment_plan_id on public.orders (installment_plan_id, installment_seq);

alter table public.installment_plans enable row level security;
create policy "installment plans: read own or staff" on public.installment_plans for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
-- No insert/update/delete policies: only the server (service role) writes these.

-- Revokes the access an installment plan's first-installment order granted, without marking
-- it refunded — the payment is forfeited, not returned. Mirrors revoke_order's grant-undo
-- logic but transitions 'paid' -> 'revoked' instead of 'paid' -> 'refunded'.
create function public.revoke_installment_order(p_order uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  g jsonb;
  c text;
  cur_found boolean;
  cur timestamptz;
  g_had boolean;
  g_before timestamptz;
begin
  update public.orders set status = 'revoked' where id = p_order and status = 'paid' returning * into o;
  if not found then return false; end if;

  for g in select * from jsonb_array_elements(coalesce(o.grants, '[]'::jsonb)) loop
    c := g ->> 'code';
    if (g ->> 'after') is not null then continue; end if; -- installments only ever grant lifetime
    g_had := (g ->> 'had')::boolean;
    g_before := (g ->> 'before')::timestamptz;
    if g_had and g_before is null then continue; end if; -- was lifetime before this order already

    cur_found := false;
    select true, r.expires_at into cur_found, cur from public.indicator_rights r where r.user_id = o.user_id and r.code = c for update;
    if not coalesce(cur_found, false) or cur is not null then continue; end if; -- changed since, or not lifetime; leave to staff

    if exists ( -- another paid/revoked order also independently gives lifetime
      select 1 from public.orders x, jsonb_array_elements(coalesce(x.grants, '[]'::jsonb)) xg
      where x.user_id = o.user_id and x.id <> o.id and x.status in ('paid', 'revoked')
        and xg ->> 'code' = c and xg ->> 'after' is null
        and not ((xg ->> 'had')::boolean and xg ->> 'before' is null)
    ) then continue; end if;

    if g_had then
      update public.indicator_rights set expires_at = g_before, note = 'ผ่อนไม่สำเร็จ: ' || o.product_name where user_id = o.user_id and code = c;
    else
      delete from public.indicator_rights where user_id = o.user_id and code = c;
    end if;
  end loop;
  return true;
end;
$$;
revoke execute on function public.revoke_installment_order(uuid) from public, anon, authenticated;
