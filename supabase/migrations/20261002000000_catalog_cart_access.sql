-- Access for the storefront and catalog management. Apply after the base schema.
begin;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles_read_self" on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "categories_read" on public.categories for select to anon, authenticated
  using (true);
create policy "categories_admin_insert" on public.categories for insert to authenticated
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'));
create policy "categories_admin_update" on public.categories for update to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'))
  with check (exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'));

create policy "products_read" on public.products for select to anon, authenticated
  using (is_active or seller_id = (select auth.uid()) or exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
  ));
create policy "products_insert" on public.products for insert to authenticated
  with check (seller_id = (select auth.uid()) and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role in ('SELLER', 'ADMIN')
  ));
create policy "products_update" on public.products for update to authenticated
  using (seller_id = (select auth.uid()) or exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
  ))
  with check (seller_id = (select auth.uid()) or exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
  ));

create policy "cart_read_self" on public.cart_items for select to authenticated
  using (user_id = (select auth.uid()));
create policy "cart_insert_self" on public.cart_items for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "cart_update_self" on public.cart_items for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "cart_delete_self" on public.cart_items for delete to authenticated
  using (user_id = (select auth.uid()));

create policy "orders_read_self" on public.orders for select to authenticated
  using (user_id = (select auth.uid()));
create policy "order_items_read_self" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders where id = order_id and user_id = (select auth.uid())));

-- Profile roles are provisioned by an administrator, never changed from the browser.
revoke insert, update, delete on public.profiles from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5000000, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product_images_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');
create policy "product_images_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and name ~ '^[0-9a-f-]+/cover$' and exists (
    select 1 from public.products where id::text = split_part(name, '/', 1)
      and (seller_id = (select auth.uid()) or exists (
        select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
      ))
  ));
create policy "product_images_update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and exists (
    select 1 from public.products where id::text = split_part(name, '/', 1)
      and (seller_id = (select auth.uid()) or exists (
        select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
      ))
  ))
  with check (bucket_id = 'product-images' and exists (
    select 1 from public.products where id::text = split_part(name, '/', 1)
      and (seller_id = (select auth.uid()) or exists (
        select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN'
      ))
  ));

commit;
