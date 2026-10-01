import { placeOrderSchema } from "@/features/checkout/model/schemas";
import type { CheckoutDatabase } from "@/features/checkout/model/types";
import { createClient } from "@/shared/api/supabase/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Некорректные данные заказа" }, { status: 400 });
  }

  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { data: orderId, error } = await supabase.rpc("place_order", {
    p_items: parsed.data.items,
    p_shipping_address: parsed.data.shipping_address,
  });

  if (error) {
    if (error.message.includes("PRODUCT_UNAVAILABLE")) {
      return Response.json({ error: "Товар недоступен или закончился" }, { status: 409 });
    }
    return Response.json({ error: "Не удалось создать заказ" }, { status: 500 });
  }

  return Response.json({ order_id: orderId }, { status: 201 });
}
