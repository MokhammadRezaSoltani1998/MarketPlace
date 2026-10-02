"use client";

import { createClient } from "@/shared/api/supabase/client";
import { setCartQuantity } from "../model/cart";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddToCartButton({ productId, stock }: { productId: string; stock: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function add() {
    setPending(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data, error } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
      if (error) throw error;
      if ((data?.quantity ?? 0) >= stock) { setMessage("Больше товара нет в наличии"); return; }
      await setCartQuantity(user.id, productId, (data?.quantity ?? 0) + 1);
      setMessage("Добавлено в корзину");
      router.refresh();
    } catch {
      setMessage("Не удалось добавить товар");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-col gap-1"><button type="button" onClick={add} disabled={pending || stock < 1} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-50">В корзину</button>{message && <span role="status" className="text-xs">{message}</span>}</div>;
}
