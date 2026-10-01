import type { CheckoutDatabase } from "@/features/checkout/model/types";
import { createClient } from "@/shared/api/supabase/server";
import { z } from "zod";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) {
    return Response.json({ error: "Некорректный ID заказа" }, { status: 400 });
  }

  const supabase = await createClient<CheckoutDatabase>();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  const { error } = await supabase.rpc("cancel_pending_order", { p_order_id: id });
  if (error) {
    if (error.message.includes("ORDER_NOT_CANCELLABLE")) {
      return Response.json({ error: "Заказ не найден или его нельзя отменить" }, { status: 409 });
    }
    return Response.json({ error: "Не удалось отменить заказ" }, { status: 500 });
  }

  return Response.json({ status: "CANCELLED" });
}
