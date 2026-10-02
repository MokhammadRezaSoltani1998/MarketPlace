"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function cancel() {
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      if (!response.ok) {
        const result: { error?: string } = await response.json();
        throw new Error(result.error ?? "Не удалось отменить заказ");
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось отменить заказ");
    } finally {
      setPending(false);
    }
  }

  return <div><button type="button" disabled={pending} onClick={cancel} className="rounded border border-red-600 px-4 py-2 text-red-600 disabled:opacity-50">Отменить заказ</button>{error && <p role="alert" className="mt-2 text-red-600">{error}</p>}</div>;
}
