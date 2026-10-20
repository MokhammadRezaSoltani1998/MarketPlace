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

  // Keep older checkout clients that omit delivery_method on the courier RPC.
  let legacyCourier = false;
  if (body !== null && typeof body === "object" && !Array.isArray(body)
    && !Object.hasOwn(body, "delivery_method")) {
    body = { ...body, delivery_method: "COURIER" };
    legacyCourier = true;
  }
  const parsed = placeOrderSchema.safeParse(body);
  if (!parsed.success) {
    const invalidPoint = parsed.error.issues.some((issue) => issue.path[0] === "pickup_point_id");
    return Response.json({ error: invalidPoint ? "Некорректный пункт выдачи" : "Некорректные данные заказа" }, { status: 400 });
  }

  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const args = {
    p_items: parsed.data.items,
    p_shipping_address: parsed.data.shipping_address,
    ...(!legacyCourier && {
      p_delivery_method: parsed.data.delivery_method,
      p_pickup_point_id: parsed.data.delivery_method === "PICKUP" ? parsed.data.pickup_point_id : null,
    }),
  };
  const { data: orderId, error } = await supabase.rpc("place_order", args);

  if (error) {
    if (error.message.includes("PRODUCT_UNAVAILABLE")) {
      return Response.json({ error: "Товар недоступен или закончился" }, { status: 409 });
    }
    if (error.message.includes("MULTIPLE_SELLERS_NOT_SUPPORTED")) {
      return Response.json({ error: "Заказ может содержать товары только одного продавца" }, { status: 409 });
    }
    if (error.message.includes("INVALID_DELIVERY")) {
      return Response.json({ error: "Некорректный способ получения или пункт выдачи" }, { status: 400 });
    }
    if (["INVALID_ADDRESS", "INVALID_ITEMS", "DUPLICATE_PRODUCT"].some((code) => error.message.includes(code))) {
      return Response.json({ error: "Некорректные данные заказа" }, { status: 400 });
    }
    return Response.json({ error: "Не удалось создать заказ" }, { status: 500 });
  }

  return Response.json({ order_id: orderId }, { status: 201 });
}
