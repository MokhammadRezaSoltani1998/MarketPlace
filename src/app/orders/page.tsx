import { createClient } from "@/shared/api/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: orders, error } = await supabase.from("orders").select("id, created_at, status, total_amount").eq("user_id", user.id).order("created_at", { ascending: false });

  return <main className="mx-auto w-full max-w-4xl p-6"><h1 className="mb-6 text-3xl font-bold">Мои заказы</h1>
    {error ? <p role="alert">Не удалось загрузить заказы</p> : !orders?.length ? <p>Заказов пока нет.</p> : <div className="space-y-3">{orders.map((order) => <Link href={`/orders/${order.id}`} key={order.id} className="block rounded-xl border p-4 hover:bg-slate-50"><span className="font-semibold">Заказ от {new Date(order.created_at).toLocaleDateString("ru-RU")}</span><span className="ml-3">{order.status}</span><span className="ml-3">{order.total_amount.toLocaleString("ru-RU")} ₽</span></Link>)}</div>}
  </main>;
}
