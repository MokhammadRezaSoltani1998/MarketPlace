import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";

type CartRow = Database["public"]["Tables"]["cart_items"]["Row"];
type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type CartLine = { product: ProductRow; quantity: number };

export async function loadCart(userId: string): Promise<CartLine[]> {
  const supabase = createClient();
  const { data: rows, error } = await supabase.from("cart_items").select("*").eq("user_id", userId);
  if (error) throw error;
  if (!rows?.length) return [];
  const { data: products, error: productError } = await supabase.from("products").select("*").in("id", rows.map((row: CartRow) => row.product_id));
  if (productError) throw productError;
  const byId = new Map((products ?? []).map((product: ProductRow) => [product.id, product]));
  return rows.flatMap((row: CartRow) => {
    const product = byId.get(row.product_id);
    return product ? [{ product, quantity: row.quantity }] : [];
  });
}

export async function setCartQuantity(userId: string, productId: string, quantity: number) {
  const supabase = createClient();
  if (quantity <= 0) {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("cart_items").upsert({ user_id: userId, product_id: productId, quantity }, { onConflict: "user_id,product_id" });
  if (error) throw error;
}
