import { createClient } from "@/shared/api/supabase/server";
import { PICKUP_POINTS } from "@/features/checkout/model/pickup-points";
import type { CheckoutDatabase } from "@/features/checkout/model/types";
import CancelOrderButton from "@/features/checkout/ui/cancel-order-button";
import PayOrderButton from "@/features/checkout/ui/pay-order-button";
import type { Json } from "@/shared/api/supabase/database.types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

function getCourierAddress(shippingAddress: Json): string | null {
  if (!shippingAddress || typeof shippingAddress !== "object" || Array.isArray(shippingAddress)) return null;
  const address = shippingAddress.address;
  return typeof address === "string" && address.trim() ? address : null;
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !order) notFound();
  const { data: items } = await supabase.from("order_items").select("quantity, price_at_purchase, products(title, slug)").eq("order_id", order.id);
  const pickupPoint = PICKUP_POINTS.find((point) => point.id === order.pickup_point_id);
  const courierAddress = getCourierAddress(order.shipping_address);

  return <main className="mx-auto w-full max-w-4xl p-6"><Link href="/orders" className="text-blue-600 underline">← Все заказы</Link><h1 className="my-5 text-3xl font-bold">Заказ {order.id}</h1>
    <p>Статус: {order.status}</p><p>Сумма: {order.total_amount.toLocaleString("ru-RU")} ₽</p>
    <section aria-label="Получение заказа" className="mt-4 space-y-1">
      <p>Способ получения: {order.delivery_method === "PICKUP" ? "Самовывоз" : "Курьер"}</p>
      {order.delivery_method === "PICKUP" && (pickupPoint ? <>
        <p>Город: {pickupPoint.city}</p>
        <p>Пункт выдачи: {pickupPoint.provider}, {pickupPoint.address}</p>
      </> : <p>Данные пункта выдачи недоступны.</p>)}
      {order.delivery_method !== "PICKUP" && <p>Адрес доставки: {courierAddress ?? "не указан"}</p>}
    </section>
    <div className="my-5 space-y-2">{items?.map((item, index) => <div key={index} className="rounded border p-3"><Link href={`/product/${item.products?.slug ?? ""}`} className="hover:underline">{item.products?.title ?? "Товар"}</Link> — {item.quantity} × {item.price_at_purchase.toLocaleString("ru-RU")} ₽</div>)}</div>
    {order.status === "PENDING" && <><PayOrderButton orderId={order.id} /><CancelOrderButton orderId={order.id} /><p className="mt-3 text-sm text-slate-600">Оплатите заказ в течение 15 минут с момента создания.</p></>}
  </main>;
}
