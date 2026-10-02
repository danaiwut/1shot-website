-- Store: products, prices, Stripe orders and subscriptions.
-- Paying through Stripe grants indicator_rights automatically; the free Exness IB path
-- (staff granting rights by hand) keeps working unchanged.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  kind text not null check (kind in ('single', 'bundle')),
  -- Indicator codes this product unlocks.
  codes text[] not null check (cardinality(codes) > 0),
  features text[] not null default '{}',
  active boolean not null default true,
  featured boolean not null default false,
  sort int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  billing text not null check (billing in ('one_time', 'subscription')),
  -- Satang (1 THB = 100). Stripe's THB minimum is 10 THB.
  amount_satang int not null check (amount_satang >= 1000),
  currency text not null default 'thb' check (currency = 'thb'),
  -- subscription: renews every interval. one_time: access for duration_days (null = lifetime).
  interval text check (interval in ('month', 'year')),
  duration_days int check (duration_days > 0),
  active boolean not null default true,
  sort int not null default 100,
  created_at timestamptz not null default now(),
  check ((billing = 'subscription') = (interval is not null)),
  check (billing = 'one_time' or duration_days is null)
);
create index product_prices_product_id on public.product_prices (product_id);

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

alter table public.products enable row level security;
alter table public.product_prices enable row level security;
create policy "products: read active or staff" on public.products for select to anon, authenticated
  using (active or (select public.is_staff()));
create policy "products: staff insert" on public.products for insert to authenticated with check (public.is_staff());
create policy "products: staff update" on public.products for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "products: staff delete" on public.products for delete to authenticated using (public.is_staff());
create policy "prices: read active or staff" on public.product_prices for select to anon, authenticated
  using (active or (select public.is_staff()));
create policy "prices: staff insert" on public.product_prices for insert to authenticated with check (public.is_staff());
create policy "prices: staff update" on public.product_prices for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "prices: staff delete" on public.product_prices for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Stripe state (written only by the server with the service role)
-- ---------------------------------------------------------------------------
create table public.stripe_customers (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  price_id uuid references public.product_prices (id) on delete set null,
  -- Snapshot at purchase time, so history survives catalogue edits.
  product_name text not null,
  codes text[] not null,
  billing text not null check (billing in ('one_time', 'subscription')),
  interval text,
  duration_days int,
  amount_satang int not null,
  currency text not null default 'thb',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
  -- 'checkout' = first payment, 'renewal' = recurring subscription invoice.
  kind text not null default 'checkout' check (kind in ('checkout', 'renewal')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  stripe_invoice_id text unique,
  receipt_url text,
  access_until timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index orders_user_id on public.orders (user_id, created_at desc);
create index orders_status on public.orders (status, created_at desc);
create index orders_payment_intent on public.orders (stripe_payment_intent_id);
create index orders_product_id on public.orders (product_id);
create index orders_price_id on public.orders (price_id);

create table public.subscriptions (
  id text primary key, -- Stripe subscription id
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  price_id uuid references public.product_prices (id) on delete set null,
  product_name text not null,
  codes text[] not null,
  status text not null,
  interval text,
  amount_satang int not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_id on public.subscriptions (user_id);
create index subscriptions_product_id on public.subscriptions (product_id);
create index subscriptions_price_id on public.subscriptions (price_id);
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- Processed webhook events, for idempotency.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_customers enable row level security;
alter table public.orders enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stripe_events enable row level security;
create policy "orders: read own or staff" on public.orders for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "subscriptions: read own or staff" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "stripe customers: staff read" on public.stripe_customers for select to authenticated
  using ((select public.is_staff()));
-- stripe_events: no policies (service role only).

-- ---------------------------------------------------------------------------
-- Fulfilment: extend rights without ever shortening them.
--   p_until set  → access until at least p_until (subscriptions: end of paid period)
--   p_days set   → p_days more, counted from the later of now and the current expiry
--   both null    → lifetime
-- ---------------------------------------------------------------------------
create function public.grant_purchase(p_user uuid, p_codes text[], p_days int, p_until timestamptz, p_note text)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  c text;
  cur timestamptz;
  had boolean;
  target timestamptz;
  latest timestamptz;
begin
  foreach c in array p_codes loop
    select true, r.expires_at into had, cur from public.indicator_rights r where r.user_id = p_user and r.code = c for update;
    if had and cur is null then
      target := null; -- already lifetime
    elsif p_until is null and p_days is null then
      target := null;
    elsif p_until is not null then
      target := greatest(coalesce(cur, p_until), p_until);
    else
      target := greatest(coalesce(cur, now()), now()) + make_interval(days => p_days);
    end if;

    insert into public.indicator_rights (user_id, code, expires_at, note)
    values (p_user, c, target, p_note)
    on conflict (user_id, code) do update set expires_at = excluded.expires_at, note = excluded.note;

    if target is not null and (latest is null or target > latest) then latest := target; end if;
    had := false;
  end loop;
  return latest;
end;
$$;
revoke execute on function public.grant_purchase(uuid, text[], int, timestamptz, text) from public, anon, authenticated;
