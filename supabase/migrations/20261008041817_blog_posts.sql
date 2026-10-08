-- Homepage blog: Facebook posts from the 1SHOT page, shown as cards that link to the post.
-- Staff paste a post link; the server reads its preview (text + images), copies the images into the
-- public blog-images bucket (Facebook image links expire) and stores the post here.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  url text not null unique check (url ~ '^https://([a-z0-9-]+\.)?(facebook\.com|fb\.com|fb\.watch)/'),
  page_name text not null default '' check (char_length(page_name) <= 80),
  body text not null default '' check (char_length(body) <= 2000),
  -- Object paths in the blog-images bucket, in display order.
  image_paths text[] not null default '{}' check (cardinality(image_paths) <= 8),
  posted_at timestamptz not null default now(),
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_list on public.blog_posts (active, posted_at desc);
create index blog_posts_created_by on public.blog_posts (created_by);
create trigger blog_posts_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

alter table public.blog_posts enable row level security;
-- Separate policies: visitors (anon) may not execute is_staff().
create policy "blog_posts: public read active" on public.blog_posts for select to anon, authenticated using (active);
create policy "blog_posts: staff read all" on public.blog_posts for select to authenticated using ((select public.is_staff()));
create policy "blog_posts: staff insert" on public.blog_posts for insert to authenticated with check ((select public.is_staff()));
create policy "blog_posts: staff update" on public.blog_posts for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "blog_posts: staff delete" on public.blog_posts for delete to authenticated using ((select public.is_staff()));

-- Public bucket: read through public URLs; written only server-side with the service role after a staff check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
