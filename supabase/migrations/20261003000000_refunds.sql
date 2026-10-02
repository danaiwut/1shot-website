-- Refunds take back exactly what the refunded order gave.
-- Each paid order now records, per code, the right before and after it was granted (orders.grants);
-- revoke_order undoes that contribution without touching time added by other orders or by staff.

alter table public.orders add column grants jsonb;

drop function public.grant_purchase(uuid, text[], int, timestamptz, text);

-- Grants an order's rights and records the change. Never shortens existing access.
--   one-time: duration_days more (from the later of now and the current expiry), or lifetime
--   subscription: until at least p_until (end of the paid period)
create function public.grant_order(p_order uuid, p_until timestamptz)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  c text;
  had boolean;
  cur timestamptz;
  target timestamptz;
  latest timestamptz;
  log jsonb := '[]'::jsonb;
begin
  select * into o from public.orders where id = p_order for update;
  if not found then raise exception 'order % not found', p_order; end if;

  foreach c in array o.codes loop
    had := false;
    cur := null;
    select true, r.expires_at into had, cur from public.indicator_rights r where r.user_id = o.user_id and r.code = c for update;
    had := coalesce(had, false);

    if had and cur is null then
      target := null; -- already lifetime
    elsif o.billing = 'subscription' then
      target := greatest(coalesce(cur, p_until), p_until);
    elsif o.duration_days is null then
      target := null;
    else
      target := greatest(coalesce(cur, now()), now()) + make_interval(days => o.duration_days);
    end if;

    insert into public.indicator_rights (user_id, code, expires_at, note)
    values (o.user_id, c, target, 'ซื้อ: ' || o.product_name)
    on conflict (user_id, code) do update set expires_at = excluded.expires_at, note = excluded.note;

    log := log || jsonb_build_object('code', c, 'had', had, 'before', cur, 'after', target, 'at', now());
    if target is not null and (latest is null or target > latest) then latest := target; end if;
  end loop;

  update public.orders set grants = log, access_until = latest where id = p_order;
  return latest;
end;
$$;

-- Marks a paid order refunded and removes the access it added. Returns false if it was not paid.
create function public.revoke_order(p_order uuid)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  o public.orders;
  g jsonb;
  c text;
  cur_found boolean;
  cur timestamptz;
  g_had boolean;
  g_before timestamptz;
  g_after timestamptz;
  g_at timestamptz;
  added interval;
  next_exp timestamptz;
begin
  update public.orders set status = 'refunded' where id = p_order and status = 'paid' returning * into o;
  if not found then return false; end if;

  for g in select * from jsonb_array_elements(coalesce(o.grants, '[]'::jsonb)) loop
    c := g ->> 'code';
    g_had := (g ->> 'had')::boolean;
    g_before := (g ->> 'before')::timestamptz;
    g_after := (g ->> 'after')::timestamptz;
    g_at := (g ->> 'at')::timestamptz;

    cur_found := false;
    select true, r.expires_at into cur_found, cur from public.indicator_rights r where r.user_id = o.user_id and r.code = c for update;
    if not coalesce(cur_found, false) then continue; end if;

    if g_after is null then
      -- This order gave lifetime access.
      if g_had and g_before is null then continue; end if;          -- it was lifetime already
      if cur is not null then continue; end if;                     -- changed since; leave it to staff
      if exists (                                                   -- another paid order also gives lifetime
        select 1 from public.orders x, jsonb_array_elements(coalesce(x.grants, '[]'::jsonb)) xg
        where x.user_id = o.user_id and x.id <> o.id and x.status = 'paid'
          and xg ->> 'code' = c and xg ->> 'after' is null
          and not ((xg ->> 'had')::boolean and xg ->> 'before' is null)
      ) then continue; end if;
      if g_had then
        update public.indicator_rights set expires_at = g_before, note = 'คืนเงิน: ' || o.product_name where user_id = o.user_id and code = c;
      else
        delete from public.indicator_rights where user_id = o.user_id and code = c;
      end if;
    else
      if cur is null then continue; end if;                         -- lifetime from elsewhere
      added := g_after - greatest(coalesce(g_before, g_at), g_at);
      next_exp := cur - added;
      -- Anything ending within a minute is treated as gone (timestamps drift slightly between grant and refund).
      if next_exp <= now() + interval '1 minute' then
        if g_had then
          update public.indicator_rights set expires_at = least(next_exp, now()), note = 'คืนเงิน: ' || o.product_name
            where user_id = o.user_id and code = c;
        else
          delete from public.indicator_rights where user_id = o.user_id and code = c;
        end if;
      else
        update public.indicator_rights set expires_at = least(next_exp, cur), note = 'คืนเงิน: ' || o.product_name
          where user_id = o.user_id and code = c;
      end if;
    end if;
  end loop;
  return true;
end;
$$;

revoke execute on function public.grant_order(uuid, timestamptz) from public, anon, authenticated;
revoke execute on function public.revoke_order(uuid) from public, anon, authenticated;
