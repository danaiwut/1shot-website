-- Real auth: when a user confirms a new email in Supabase Auth, mirror it into profiles.email.
-- guard_profile_update blocks email edits from clients, so the sync marks itself with a
-- transaction-local flag that the guard lets through.

create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.role()) = 'service_role' or current_setting('app.sync_auth_email', true) = 'on' then
    return new;
  end if;
  if new.id <> old.id or new.email <> old.email then
    raise exception 'ไม่สามารถแก้ไขตัวตนบัญชี';
  end if;
  if new.role <> old.role and not public.is_owner() then
    raise exception 'เฉพาะเจ้าของระบบเท่านั้นที่เปลี่ยนบทบาทได้';
  end if;
  if new.ib_verified <> old.ib_verified and not public.is_staff() then
    raise exception 'เฉพาะแอดมินเท่านั้นที่ยืนยัน IB ได้';
  end if;
  -- Changing the Exness account invalidates a previous IB verification.
  if new.exness_account is distinct from old.exness_account and not public.is_staff() then
    new.ib_verified = false;
  end if;
  return new;
end;
$$;

create function public.sync_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform set_config('app.sync_auth_email', 'on', true);
  update public.profiles set email = new.email where id = new.id;
  perform set_config('app.sync_auth_email', 'off', true);
  return new;
end;
$$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (new.email is distinct from old.email) execute function public.sync_user_email();

revoke execute on function public.sync_user_email() from public, anon, authenticated;
revoke execute on function public.guard_profile_update() from public, anon, authenticated;
