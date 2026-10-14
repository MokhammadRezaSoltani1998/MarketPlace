-- Keep the two-argument RPC available until the checkout route sends delivery details.
-- The four-argument RPC is the only implementation of order placement.
begin;

create function public.place_order(
  p_items jsonb,
  p_shipping_address jsonb,
  p_delivery_method text,
  p_pickup_point_id text
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
  v_seller_id uuid;
  v_item_seller_id uuid;
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
    or coalesce(length(btrim(p_shipping_address->>'name')), 0) not between 1 and 100
    or coalesce(length(btrim(p_shipping_address->>'phone')), 0) not between 1 and 30 then
    raise exception 'INVALID_ADDRESS' using errcode = '22023';
  end if;

  if p_delivery_method = 'COURIER' then
    if p_pickup_point_id is not null
      or coalesce(length(btrim(p_shipping_address->>'address')), 0) not between 1 and 500 then
      raise exception 'INVALID_DELIVERY' using errcode = '22023';
    end if;
  elsif p_delivery_method = 'PICKUP' then
    if p_shipping_address ? 'address' or p_pickup_point_id is null
      or not p_pickup_point_id = any(array[
        'moscow-yandex-zapovednaya-18-4',
        'moscow-ozon-permskaya-7-2',
        'moscow-wildberries-skhodnenskaya-6-1',
        'spb-yandex-moskovskiy-220',
        'spb-ozon-lyzhny-6',
        'spb-wildberries-mebelnaya-49-92',
        'ekb-yandex-vostochnaya-34',
        'ekb-ozon-krasnolesya-16-3',
        'ekb-wildberries-mekhrentseva-46'
      ]) then
      raise exception 'INVALID_DELIVERY' using errcode = '22023';
    end if;
  else
    raise exception 'INVALID_DELIVERY' using errcode = '22023';
  end if;

  -- Product updates lock rows in a fixed order. Any error rolls back the
  -- order, its event, stock changes and all order items together.
  insert into public.orders
    (user_id, status, total_amount, shipping_address, delivery_method, pickup_point_id)
  values
    (v_user_id, 'PENDING', 0, p_shipping_address, p_delivery_method, p_pickup_point_id)
  returning id into v_order_id;

  for v_item in
    select value from jsonb_array_elements(p_items) as item(value)
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
    where id = v_product_id and is_active = true and stock_quantity >= v_quantity
    returning price, seller_id into v_price, v_item_seller_id;

    if not found then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'P0001';
    end if;

    if v_seller_id is null then
      v_seller_id := v_item_seller_id;
    elsif v_seller_id <> v_item_seller_id then
      raise exception 'MULTIPLE_SELLERS_NOT_SUPPORTED' using errcode = 'P0001';
    end if;

    insert into public.order_items
      (order_id, product_id, quantity, price_at_purchase)
    values (v_order_id, v_product_id, v_quantity, v_price);
    v_total := v_total + v_price * v_quantity;
  end loop;

  update public.orders
  set total_amount = v_total, seller_id = v_seller_id
  where id = v_order_id;
  return v_order_id;
end;
$$;

create or replace function public.place_order(p_items jsonb, p_shipping_address jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select public.place_order(p_items, p_shipping_address, 'COURIER', null::text);
$$;

revoke execute on function public.place_order(jsonb, jsonb, text, text)
  from public, anon;
grant execute on function public.place_order(jsonb, jsonb, text, text)
  to authenticated;
revoke execute on function public.place_order(jsonb, jsonb)
  from public, anon;
grant execute on function public.place_order(jsonb, jsonb)
  to authenticated;

commit;
