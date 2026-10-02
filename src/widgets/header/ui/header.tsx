import { LogoutButton } from "@/features/auth";
import { createClient } from "@/shared/api/supabase/server";
import Link from "next/link";
export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle() : { data: null };
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-10 py-4 flex justify-between items-center">
        <Link
          href={"/"}
          className="inline-block mb-6 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          Логотип тут
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm"><Link href="/catalog">Каталог</Link><Link href="/cart">Корзина</Link>{user && <Link href="/orders">Заказы</Link>}{(profile?.role === "ADMIN" || profile?.role === "SELLER") && <Link href="/dashboard">Управление</Link>}</nav>
        {user ? (
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <LogoutButton />
          </div>
        ) : (
          <Link href={"/login"}>Войти</Link>
        )}
      </div>
    </header>
  );
}
