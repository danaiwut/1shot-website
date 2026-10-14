-- Card image per product, uploaded on the product detail page (Storage bucket promotion-images).
-- image_scope: 'home' = the deal card shows the image on the homepage only; 'all' = everywhere the card appears.
alter table public.products
  add column image_url text check (image_url ~ '^/[^/]' or image_url ~ '^https://'),
  add column image_scope text not null default 'home' check (image_scope in ('home', 'all'));

-- The poster now lives on the product card, not the promotion banner.
alter table public.promotions drop column if exists image_scope;
