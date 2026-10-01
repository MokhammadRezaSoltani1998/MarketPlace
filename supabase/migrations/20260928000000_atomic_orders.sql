-- The checkout and cancellation functions are the only client write path for orders.
-- Both functions run in a single database transaction per RPC call.
begin;

create or replace function public.place_order(
  p_items jsonb,
  p_shipping_address jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_quantity integer;
  v_price numeric;
  v_total numeric := 0;
  v_seen_ids uuid[] := array[]::uuid[];
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) not between 1 and 100 then
    raise exception 'INVALID_ITEMS' using errcode = '22023';
  end if;

  if p_shipping_address is null or jsonb_typeof(p_shipping_address) <> 'object'
    or p_shipping_address = '{}'::jsonb then
    raise exception 'INVALID_ADDRESS' using errcode = '22023';
  end if;

  -- Lock products in a fixed order to avoid deadlocks between multi-item orders.
  -- A failed statement aborts the RPC transaction, including any earlier updates.
  insert into public.orders (user_id, status, total_amount, shipping_address)
  values (v_user_id, 'PENDING', 0, p_shipping_address)
  returning id into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(p_items) as item(value)
    order by (value->>'product_id')::uuid
  loop
    if jsonb_typeof(v_item) <> 'object'
      or jsonb_typeof(v_item->'product_id') <> 'string'
      or jsonb_typeof(v_item->'quantity') <> 'number'
      or (v_item->>'quantity') !~ '^[1-9][0-9]*$' then
      raise exception 'INVALID_ITEMS' using errcode = '22023';
    end if;

    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    if v_product_id = any(v_seen_ids) then
      raise exception 'DUPLICATE_PRODUCT' using errcode = '22023';
    end if;
    v_seen_ids := array_append(v_seen_ids, v_product_id);

    update public.products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product_id
      and is_active = true
      and stock_quantity >= v_quantity
    returning price into v_price;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001';
    end if;

    insert into public.order_items
      (order_id, product_id, quantity, price_at_purchase)
    values (v_order_id, v_product_id, v_quantity, v_price);
    v_total := v_total + v_price * v_quantity;
  end loop;

  update public.orders set total_amount = v_total where id = v_order_id;
  return v_order_id;
end;
$$;

create or replace function public.cancel_pending_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  -- Only one concurrent cancellation can make this state transition.
  update public.orders
  set status = 'CANCELLED'
  where id = p_order_id and user_id = v_user_id and status = 'PENDING'
  returning id into v_order_id;

  if not found then
    raise exception 'ORDER_NOT_CANCELLABLE' using errcode = 'P0001';
  end if;

  for v_item in
    select product_id, quantity
    from public.order_items
    where order_id = v_order_id
    order by product_id
  loop
    update public.products
    set stock_quantity = stock_quantity + v_item.quantity
    where id = v_item.product_id;
  end loop;
end;
$$;

revoke execute on function public.place_order(jsonb, jsonb) from public, anon;
revoke execute on function public.cancel_pending_order(uuid) from public, anon;
grant execute on function public.place_order(jsonb, jsonb) to authenticated;
grant execute on function public.cancel_pending_order(uuid) to authenticated;

-- Orders must not be created or changed through direct REST table writes.
revoke insert, update, delete on public.orders, public.order_items
  from public, anon, authenticated;

commit;
