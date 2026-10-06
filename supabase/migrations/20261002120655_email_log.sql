-- Every transactional email (purchase confirmation, refund notice), sent or not, for support and auditing.
create table public.email_log (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  kind text not null check (kind in ('purchase', 'renewal', 'refund')),
  to_email text not null,
  subject text not null,
  html text not null,
  -- sent: accepted by the provider · failed: provider error · logged: no provider configured (or mockup mode)
  status text not null check (status in ('sent', 'failed', 'logged')),
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  unique (order_id, kind)
);
create index email_log_created_at on public.email_log (created_at desc);
create index email_log_user_id on public.email_log (user_id);

alter table public.email_log enable row level security;
create policy "email log: staff read" on public.email_log for select to authenticated using ((select public.is_staff()));
