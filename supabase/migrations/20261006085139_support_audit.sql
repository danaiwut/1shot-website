-- Member support, announcements and a full audit trail (ported from the app.1shottrading.com back office).

-- ---------------------------------------------------------------------------
-- Support requests ("คำขอและความช่วยเหลือ"): a member opens a request, staff and member reply in a thread.
-- ---------------------------------------------------------------------------
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('rights', 'room', 'help')),
  indicator_code text references public.indicators (code) on delete set null,
  message text not null check (char_length(message) between 1 and 4000),
  status text not null default 'open' check (status in ('open', 'answered', 'resolved')),
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_requests_user on public.support_requests (user_id, created_at desc);
create index support_requests_status on public.support_requests (status, updated_at desc);
create index support_requests_assigned on public.support_requests (assigned_to);
create index support_requests_indicator on public.support_requests (indicator_code);
create trigger support_requests_touch before update on public.support_requests
  for each row execute function public.touch_updated_at();

create table public.support_messages (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.support_requests (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  from_staff boolean not null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index support_messages_request on public.support_messages (request_id, created_at);
create index support_messages_author on public.support_messages (author_id);

alter table public.support_requests enable row level security;
alter table public.support_messages enable row level security;

create policy "support: read own or staff" on public.support_requests for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "support: member opens own" on public.support_requests for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'open' and assigned_to is null);
create policy "support: staff update" on public.support_requests for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "support msgs: read own thread or staff" on public.support_messages for select to authenticated
  using ((select public.is_staff()) or exists (
    select 1 from public.support_requests r where r.id = request_id and r.user_id = (select auth.uid())
  ));
create policy "support msgs: post in own thread or staff" on public.support_messages for insert to authenticated
  with check (
    author_id = (select auth.uid()) and (
      ((select public.is_staff()) and from_staff)
      or (not from_staff and exists (select 1 from public.support_requests r where r.id = request_id and r.user_id = (select auth.uid())))
    )
  );

-- A member reply re-opens the request; a staff reply marks it answered.
create function public.support_message_status() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.support_requests
     set status = case when new.from_staff then 'answered' else 'open' end
   where id = new.request_id;
  return new;
end;
$$;
create trigger support_messages_status after insert on public.support_messages
  for each row execute function public.support_message_status();

-- ---------------------------------------------------------------------------
-- Announcements ("ประกาศ")
-- ---------------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 8000),
  pinned boolean not null default false,
  published boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_feed on public.announcements (published, pinned desc, created_at desc);
create index announcements_created_by on public.announcements (created_by);
create trigger announcements_touch before update on public.announcements
  for each row execute function public.touch_updated_at();

alter table public.announcements enable row level security;
create policy "announcements: members read published, staff all" on public.announcements for select to authenticated
  using (published or (select public.is_staff()));
create policy "announcements: staff insert" on public.announcements for insert to authenticated with check ((select public.is_staff()));
create policy "announcements: staff update" on public.announcements for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "announcements: staff delete" on public.announcements for delete to authenticated using ((select public.is_staff()));

-- ---------------------------------------------------------------------------
-- Audit log ("ประวัติการจัดการสิทธิ์" for staff, "ประวัติของฉัน" for members).
-- Rights / role / IB changes are captured by triggers, so nothing slips through —
-- whether a staff member, a Stripe purchase or a refund made the change.
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,  -- null = system (payment, webhook)
  subject_id uuid references public.profiles (id) on delete cascade, -- the member affected
  action text not null,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_subject on public.audit_log (subject_id, created_at desc);
create index audit_log_created on public.audit_log (created_at desc);
create index audit_log_actor on public.audit_log (actor_id);

alter table public.audit_log enable row level security;
create policy "audit: own history or staff" on public.audit_log for select to authenticated
  using (subject_id = (select auth.uid()) or (select public.is_staff()));
-- Writes only through the triggers below and the service role.

create function public.audit_rights() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log (actor_id, subject_id, action, detail)
    values (auth.uid(), old.user_id, 'right.revoke', jsonb_build_object('code', old.code, 'expires_at', old.expires_at, 'note', old.note));
    return old;
  end if;
  if tg_op = 'UPDATE' and new.expires_at is not distinct from old.expires_at then
    return new;
  end if;
  insert into public.audit_log (actor_id, subject_id, action, detail)
  values (
    auth.uid(), new.user_id, 'right.grant',
    jsonb_build_object('op', lower(tg_op), 'code', new.code, 'expires_at', new.expires_at, 'previous', case when tg_op = 'UPDATE' then to_jsonb(old.expires_at) else null end, 'note', new.note)
  );
  return new;
end;
$$;
create trigger indicator_rights_audit after insert or update or delete on public.indicator_rights
  for each row execute function public.audit_rights();

create function public.audit_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role then
    insert into public.audit_log (actor_id, subject_id, action, detail)
    values (auth.uid(), new.id, 'role.change', jsonb_build_object('from', old.role, 'to', new.role));
  end if;
  if new.ib_verified is distinct from old.ib_verified then
    insert into public.audit_log (actor_id, subject_id, action, detail)
    values (auth.uid(), new.id, case when new.ib_verified then 'ib.verify' else 'ib.unverify' end, jsonb_build_object('exness_account', new.exness_account));
  end if;
  return new;
end;
$$;
create trigger profiles_audit after update on public.profiles
  for each row execute function public.audit_profile();

revoke execute on function public.support_message_status() from public, anon, authenticated;
revoke execute on function public.audit_rights() from public, anon, authenticated;
revoke execute on function public.audit_profile() from public, anon, authenticated;
