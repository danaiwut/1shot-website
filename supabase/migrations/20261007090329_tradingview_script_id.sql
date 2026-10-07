-- TradingView script ID (pine_id, e.g. "PUB;a1b2c3…") per indicator, used to grant invite-only access automatically.
alter table public.indicators add column tv_script_id text check (tv_script_id is null or tv_script_id ~ '^PUB;[A-Za-z0-9]{6,64}$');
comment on column public.indicators.tv_script_id is 'TradingView pine_id of the invite-only script (Manage access).';
