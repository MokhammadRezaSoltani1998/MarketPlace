import { z } from "zod";
import { notFound } from "next/navigation";

export default async function MockPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  return <main className="mx-auto max-w-lg p-6">
    <h1 className="mb-4 text-3xl font-bold">Тестовая оплата</h1>
    <p className="mb-5">Подтвердите платёж через MockPaymentProvider.</p>
    <form action="/api/payments/mock/confirm" method="post">
      <input type="hidden" name="attempt_id" value={id} />
      <button type="submit" className="rounded bg-black px-4 py-2 text-white">Подтвердить оплату</button>
    </form>
  </main>;
}
