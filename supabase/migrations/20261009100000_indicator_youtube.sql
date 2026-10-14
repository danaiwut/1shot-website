alter table public.indicators
  add column if not exists youtube_url text;

comment on column public.indicators.youtube_url is 'Optional YouTube tutorial URL shown on the public indicator detail page.';
