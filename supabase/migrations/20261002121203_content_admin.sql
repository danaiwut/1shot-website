-- Staff manage market content (morning brief + world news) from the admin UI.
alter table public.daily_briefs add column updated_at timestamptz not null default now();
create trigger daily_briefs_touch before update on public.daily_briefs
  for each row execute function public.touch_updated_at();

create policy "briefs: staff insert" on public.daily_briefs for insert to authenticated with check ((select public.is_staff()));
create policy "briefs: staff update" on public.daily_briefs for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "briefs: staff delete" on public.daily_briefs for delete to authenticated using ((select public.is_staff()));

create policy "news: staff insert" on public.news_items for insert to authenticated with check ((select public.is_staff()));
create policy "news: staff update" on public.news_items for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "news: staff delete" on public.news_items for delete to authenticated using ((select public.is_staff()));

alter table public.news_items add constraint news_link_http check (link ~ '^https?://');
alter table public.news_items add constraint news_title_len check (char_length(title) between 1 and 300);
