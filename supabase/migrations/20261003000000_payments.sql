begin;

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  provider text not null check (length(provider) > 0),
  created_at timestamptz not null default now()
);

alter table public.payment_attempts enable row level security;
create policy "payment_attempts_read_self" on public.payment_attempts
  for select to authenticated using (exists (
    select 1 from public.orders
    where orders.id = order_id and orders.user_id = (select auth.uid())
  ));
grant select on public.payment_attempts to authenticated;
revoke insert, update, delete on public.payment_attempts from public, anon, authenticated;

create function public.create_payment_attempt(p_order_id uuid, p_provider text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders%rowtype;
  v_attempt public.payment_attempts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.user_id <> auth.uid() then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_order.status <> 'PENDING' or v_order.created_at <= now() - interval '15 minutes' then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001';
  end if;
  select * into v_attempt from public.payment_attempts where order_id = p_order_id;
  if found then
    if v_attempt.provider <> p_provider then
      raise exception 'PROVIDER_MISMATCH' using errcode = 'P0001';
    end if;
    return v_attempt.id;
  end if;
  insert into public.payment_attempts (order_id, provider)
  values (p_order_id, p_provider) returning id into v_attempt.id;
  return v_attempt.id;
end;
$$;

create function public.mark_order_paid(p_attempt_id uuid, p_provider text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_order_id uuid;
begin
  select order_id into v_order_id from public.payment_attempts
  where id = p_attempt_id and provider = p_provider;
  if not found then
    raise exception 'PAYMENT_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Competes with cancellation and expiry on the same order row.
  update public.orders set status = 'PAID'
  where id = v_order_id and status = 'PENDING'
    and created_at > now() - interval '15 minutes';
  if not found and not exists (
    select 1 from public.orders where id = v_order_id and status = 'PAID'
  ) then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001';
  end if;
  return v_order_id;
end;
$$;

revoke execute on function public.create_payment_attempt(uuid, text) from public, anon;
grant execute on function public.create_payment_attempt(uuid, text) to authenticated;
revoke execute on function public.mark_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(uuid, text) to service_role;

commit;
