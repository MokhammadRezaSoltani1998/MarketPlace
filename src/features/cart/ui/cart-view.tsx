"use client";

import { loadCart, setCartQuantity, type CartLine } from "../model/cart";
import { createClient } from "@/shared/api/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CartView({ userId, checkout = false }: { userId: string; checkout?: boolean }) {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    let active = true;
    loadCart(userId).then((cart) => { if (active) setLines(cart); }).catch(() => { if (active) setError("Не удалось загрузить корзину"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  async function changeQuantity(line: CartLine, quantity: number) {
    setBusy(true);
    setError("");
    try {
      await setCartQuantity(userId, line.product.id, quantity);
      setLines((current) => current.flatMap((item) => item.product.id === line.product.id ? quantity > 0 ? [{ ...item, quantity }] : [] : [item]));
    } catch {
      setError("Не удалось обновить корзину");
    } finally {
      setBusy(false);
    }
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
          shipping_address: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        }),
      });
      const result: { error?: string; order_id?: string } = await response.json();
      if (!response.ok || !result.order_id) throw new Error(result.error ?? "Не удалось создать заказ");
      const supabase = createClient();
      const { error: clearError } = await supabase.from("cart_items").delete().eq("user_id", userId);
      if (clearError) console.error("Не удалось очистить корзину", clearError);
      router.replace(`/orders/${result.order_id}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать заказ");
    } finally {
      setBusy(false);
    }
  }

  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const unavailable = lines.some(({ product, quantity }) => !product.is_active || product.stock_quantity < quantity);

  return <main className="mx-auto w-full max-w-4xl p-6">
    <h1 className="mb-6 text-3xl font-bold">{checkout ? "Оформление заказа" : "Корзина"}</h1>
    {loading ? <p>Загрузка...</p> : lines.length === 0 ? <p>Корзина пуста. <Link className="text-blue-600 underline" href="/catalog">Перейти в каталог</Link></p> : <>
      <div className="space-y-3">{lines.map((line) => <div key={line.product.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4">
        <div><Link className="font-semibold hover:underline" href={`/product/${line.product.slug}`}>{line.product.title}</Link><p>{line.product.price.toLocaleString("ru-RU")} ₽ за шт.</p>{(!line.product.is_active || line.product.stock_quantity < line.quantity) && <p className="text-red-600">Недостаточно товара в наличии</p>}</div>
        <div className="flex items-center gap-2"><button type="button" disabled={busy} onClick={() => changeQuantity(line, line.quantity - 1)} className="rounded border px-3 py-1">−</button><span>{line.quantity}</span><button type="button" disabled={busy || line.quantity >= line.product.stock_quantity} onClick={() => changeQuantity(line, line.quantity + 1)} className="rounded border px-3 py-1">+</button><button type="button" disabled={busy} onClick={() => changeQuantity(line, 0)} className="ml-3 text-red-600">Удалить</button></div>
      </div>)}</div>
      <p className="mt-5 text-xl font-bold">Итого: {total.toLocaleString("ru-RU")} ₽</p>
      {checkout ? <form onSubmit={placeOrder} className="mt-6 flex max-w-lg flex-col gap-3">
        <label>Имя<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="block w-full rounded border p-2" /></label>
        <label>Телефон<input required maxLength={30} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="block w-full rounded border p-2" /></label>
        <label>Адрес доставки<textarea required maxLength={500} value={address} onChange={(event) => setAddress(event.target.value)} className="block w-full rounded border p-2" /></label>
        <button type="submit" disabled={busy || unavailable} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">Создать заказ</button>
        <p className="text-sm text-slate-600">Заказ резервирует товары на 15 минут. Оплатите его на странице заказа.</p>
      </form> : <Link href="/checkout" className="mt-5 inline-block rounded bg-black px-4 py-2 text-white">Оформить заказ</Link>}
    </>}
    {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
  </main>;
}
