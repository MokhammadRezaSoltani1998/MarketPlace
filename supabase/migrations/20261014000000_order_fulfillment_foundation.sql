-- Delivery, single-seller ownership and return data for the P2 order flow.
-- Existing shipping_address JSON keeps courier contact and address details.
begin;

alter table public.orders
  add column seller_id uuid references public.profiles(id),
  add column delivery_method text not null default 'COURIER'
    check (delivery_method in ('COURIER', 'PICKUP')),
  add column pickup_point_id text,
  add column delivered_at timestamptz,
  add constraint orders_delivery_details_check check (
    (delivery_method = 'COURIER' and pickup_point_id is null)
    or (delivery_method = 'PICKUP' and pickup_point_id is not null
      and length(btrim(pickup_point_id)) between 1 and 100)
  );

-- Preserve the owner of historical orders when every item has the same seller.
update public.orders as orders
set seller_id = sellers.seller_id
from (
  select items.order_id, (array_agg(distinct products.seller_id))[1] as seller_id
  from public.order_items as items
  join public.products as products on products.id = items.product_id
  group by items.order_id
  having count(distinct products.seller_id) = 1
) as sellers
where orders.id = sellers.order_id;

-- Existing delivered orders predate delivered_at; updated_at is the best
-- available timestamp for starting their return window.
update public.orders
set delivered_at = updated_at
where status = 'DELIVERED' and delivered_at is null;

create index orders_seller_created_at_idx
  on public.orders (seller_id, created_at desc)
  where seller_id is not null;

create table public.order_returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id),
  status text not null default 'RETURN_REQUESTED'
    check (status in ('RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_REJECTED', 'REFUNDED')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  refunded_at timestamptz,
  constraint order_returns_dates_check check (
    (status = 'RETURN_REQUESTED' and decided_at is null and refunded_at is null)
    or (status in ('RETURN_APPROVED', 'RETURN_REJECTED')
      and decided_at is not null and refunded_at is null)
    or (status = 'REFUNDED' and decided_at is not null and refunded_at is not null)
  )
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  event_kind text not null check (event_kind in ('ORDER_STATUS', 'RETURN_STATUS')),
  previous_status text,
  new_status text not null,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create index order_events_order_created_at_idx
  on public.order_events (order_id, created_at, id);

-- Record transitions in the same transaction as their source row changes.
create function public.record_order_status_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, event_kind, new_status, actor_id)
    values (new.id, 'ORDER_STATUS', new.status::text, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_events
      (order_id, event_kind, previous_status, new_status, actor_id)
    values (new.id, 'ORDER_STATUS', old.status::text, new.status::text, auth.uid());
  end if;
  return new;
end;
$$;

create trigger orders_record_status_event
after insert or update of status on public.orders
for each row execute function public.record_order_status_event();

create function public.record_return_status_event()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_events (order_id, event_kind, new_status, actor_id)
    values (new.order_id, 'RETURN_STATUS', new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.order_events
      (order_id, event_kind, previous_status, new_status, actor_id)
    values (new.order_id, 'RETURN_STATUS', old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger returns_record_status_event
after insert or update of status on public.order_returns
for each row execute function public.record_return_status_event();

revoke execute on function public.record_order_status_event() from public, anon, authenticated;
revoke execute on function public.record_return_status_event() from public, anon, authenticated;

alter table public.order_returns enable row level security;
alter table public.order_events enable row level security;

create policy order_returns_read_buyer on public.order_returns
  for select to authenticated using (exists (
    select 1 from public.orders
    where orders.id = order_id and orders.user_id = (select auth.uid())
  ));
create policy order_events_read_buyer on public.order_events
  for select to authenticated using (exists (
    select 1 from public.orders
    where orders.id = order_id and orders.user_id = (select auth.uid())
  ));

grant select on public.order_returns, public.order_events to authenticated;
revoke insert, update, delete on public.order_returns, public.order_events
  from public, anon, authenticated;

commit;
