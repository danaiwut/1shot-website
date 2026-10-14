-- Staff can now upload a promotion poster instead of pasting a URL, and choose whether it shows
-- only on the homepage or on every page that renders the pricing table (/pricing, /store too).

alter table public.promotions
  add column image_scope text not null default 'home' check (image_scope in ('home', 'all'));

-- Public bucket: read through public URLs; written only server-side with the service role after a staff check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('promotion-images', 'promotion-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
