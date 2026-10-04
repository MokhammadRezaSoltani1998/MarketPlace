import type { CheckoutDatabase } from "@/features/checkout/model/types";
import { getPaymentProvider } from "@/features/checkout/model/payments";
import { createClient } from "@/shared/api/supabase/server";
import { z } from "zod";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Некорректный ID заказа" }, { status: 400 });
  }
  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Требуется авторизация" }, { status: 401 });

  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id, total_amount").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (orderError) return Response.json({ error: "Не удалось загрузить заказ" }, { status: 500 });
  if (!order) return Response.json({ error: "Заказ не найден" }, { status: 404 });

  const provider = getPaymentProvider();
  const { data: attemptId, error } = await supabase.rpc("create_payment_attempt", {
    p_order_id: id, p_provider: provider.name,
  });
  if (error?.message.includes("ORDER_NOT_PAYABLE")) {
    return Response.json({ error: "Время оплаты заказа истекло" }, { status: 409 });
  }
  if (error) return Response.json({ error: "Не удалось начать оплату" }, { status: 500 });

  const payment = await provider.createPayment({
    attemptId, orderId: id, amount: order.total_amount, origin: new URL(request.url).origin,
  });
  return Response.json({ checkout_url: payment.checkoutUrl });
}
