-- Store deals.
--   kind 'pick'      : the customer chooses pick_count indicators from `codes` (the pool) at checkout,
--                      e.g. "any 2 of DT/RP/TF/AMD/SW for 15,000". The chosen codes are stored on the order,
--                      so grant_order / revoke_order work unchanged.
--   audience         : 'returning' = only customers who already bought or hold a right.
--   available_until  : the product disappears from the store after this moment (time-limited promotions).
--   badge            : short label on the card ("HOT", "โปรเดือนนี้").

alter table public.products drop constraint products_kind_check;
alter table public.products
  add constraint products_kind_check check (kind in ('single', 'bundle', 'pick')),
  add column pick_count int check (pick_count between 1 and 20),
  add column audience text not null default 'all' check (audience in ('all', 'returning')),
  add column available_until timestamptz,
  add column badge text check (char_length(badge) <= 24),
  add constraint products_pick check ((kind = 'pick') = (pick_count is not null) and (pick_count is null or pick_count <= cardinality(codes)));

-- A pick product is sold one-time only: a subscription would renew a fixed set of codes, which a pick doesn't have.
create function public.product_prices_pick_one_time() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.billing = 'subscription' and exists (select 1 from public.products p where p.id = new.product_id and p.kind = 'pick') then
    raise exception 'สินค้าแบบเลือกเองขายได้เฉพาะแบบจ่ายครั้งเดียว';
  end if;
  return new;
end;
$$;
create trigger product_prices_pick_one_time before insert or update on public.product_prices
  for each row execute function public.product_prices_pick_one_time();

-- Optional poster for the monthly promotion card: a site path ("/media/...") or an https URL.
alter table public.promotions add column image_url text check (image_url ~ '^/[^/]' or image_url ~ '^https://');
