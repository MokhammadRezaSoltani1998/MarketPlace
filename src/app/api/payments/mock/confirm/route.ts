import type { CheckoutDatabase } from "@/features/checkout/model/types";
import { getMockPaymentProvider, processPaymentNotification } from "@/features/checkout/model/payments";
import { createClient } from "@/shared/api/supabase/server";
import { z } from "zod";

export async function POST(request: Request) {
  const form = await request.formData();
  const parsed = z.uuid().safeParse(form.get("attempt_id"));
  if (!parsed.success) return Response.json({ error: "Некорректный платёж" }, { status: 400 });

  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Требуется авторизация" }, { status: 401 });

  const { data: attempt, error } = await supabase.from("payment_attempts")
    .select("order_id").eq("id", parsed.data).eq("provider", "mock").maybeSingle();
  if (error) return Response.json({ error: "Не удалось проверить платёж" }, { status: 500 });
  if (!attempt) return Response.json({ error: "Платёж не найден" }, { status: 404 });
  const { data: order } = await supabase.from("orders")
    .select("id").eq("id", attempt.order_id).eq("user_id", user.id).maybeSingle();
  if (!order) return Response.json({ error: "Заказ не найден" }, { status: 404 });

  const provider = getMockPaymentProvider();
  const notification = provider.makeSuccessNotification(parsed.data);
  const outcome = await processPaymentNotification(provider, notification.body, notification.headers);
  if (outcome === "expired") {
    return Response.json({ error: "Время оплаты заказа истекло" }, { status: 409 });
  }
  return Response.redirect(new URL(`/orders/${order.id}`, request.url), 303);
}
