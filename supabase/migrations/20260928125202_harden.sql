-- Hardening after Supabase advisors.

-- Trigger functions must never be callable through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- RLS helpers: signed-in users only (they only reveal the caller's own role/rights).
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_owner() from public, anon;
revoke execute on function public.has_indicator(text) from public, anon;
grant execute on function public.is_staff() to authenticated;
grant execute on function public.is_owner() to authenticated;
grant execute on function public.has_indicator(text) to authenticated;

-- One permissive SELECT policy per table: split "for all" staff policies into write-only ones.
drop policy "indicators: staff write" on public.indicators;
create policy "indicators: staff insert" on public.indicators for insert to authenticated with check (public.is_staff());
create policy "indicators: staff update" on public.indicators for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "indicators: staff delete" on public.indicators for delete to authenticated using (public.is_staff());

drop policy "rights: staff write" on public.indicator_rights;
create policy "rights: staff insert" on public.indicator_rights for insert to authenticated with check (public.is_staff());
create policy "rights: staff update" on public.indicator_rights for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "rights: staff delete" on public.indicator_rights for delete to authenticated using (public.is_staff());

-- Covering indexes for foreign keys.
create index indicator_rights_code on public.indicator_rights (code);
create index indicator_rights_granted_by on public.indicator_rights (granted_by);
create index telegram_invites_user_id on public.telegram_invites (user_id);

-- telegram_invites intentionally has no client policies (server-only table).
comment on table public.telegram_invites is 'Server-only: single-use Telegram join invites. No client RLS policies by design.';
