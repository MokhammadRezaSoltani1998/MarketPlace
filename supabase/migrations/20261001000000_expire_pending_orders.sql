-- A PENDING order reserves stock for at most 15 minutes.
-- The scheduled call runs as the database role that creates the cron job.
begin;

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.expire_pending_orders()
returns integer
language sql
security invoker
set search_path = ''
as $$
  with expired as (
    update public.orders
    set status = 'CANCELLED'
    where status = 'PENDING'
      and created_at <= now() - interval '15 minutes'
    returning id
  ), quantities as (
    select item.product_id, sum(item.quantity)::integer as quantity
    from public.order_items as item
    join expired on expired.id = item.order_id
    group by item.product_id
  ), restocked as (
    update public.products as product
    set stock_quantity = product.stock_quantity + quantities.quantity
    from quantities
    where product.id = quantities.product_id
    returning product.id
  )
  -- A data-changing CTE runs to completion even when its result is not selected.
  select count(*)::integer from expired;
$$;

revoke execute on function public.expire_pending_orders()
  from public, anon, authenticated;

select cron.schedule(
  'expire-pending-orders',
  '* * * * *',
  'select public.expire_pending_orders()'
);

commit;
