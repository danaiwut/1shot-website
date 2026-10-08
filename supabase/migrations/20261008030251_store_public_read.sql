-- Visitors (anon) may not execute is_staff(), so one policy mixing both made the whole read fail for them
-- (the homepage packages and /pricing were empty when signed out).
drop policy "products: read active or staff" on public.products;
create policy "products: public read active" on public.products for select to anon, authenticated using (active);
create policy "products: staff read all" on public.products for select to authenticated using ((select public.is_staff()));

drop policy "prices: read active or staff" on public.product_prices;
create policy "prices: public read active" on public.product_prices for select to anon, authenticated using (active);
create policy "prices: staff read all" on public.product_prices for select to authenticated using ((select public.is_staff()));
