"use client";

import { useState } from "react";

export default function PayOrderButton({ orderId }: { orderId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/pay`, { method: "POST" });
      const result: { checkout_url?: string; error?: string } = await response.json();
      if (!response.ok || !result.checkout_url) throw new Error(result.error ?? "Не удалось начать оплату");
      window.location.assign(result.checkout_url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось начать оплату");
      setPending(false);
    }
  }

  return <div className="my-3">
    <button type="button" disabled={pending} onClick={pay}
      className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">Оплатить</button>
    {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
  </div>;
}
