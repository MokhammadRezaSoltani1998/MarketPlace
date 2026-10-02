import CatalogManager from "@/features/catalog/ui/catalog-manager";
import { createClient } from "@/shared/api/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN" && profile?.role !== "SELLER") redirect("/");
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (profile.role === "SELLER") query = query.eq("seller_id", user.id);
  const [{ data: products, error: productsError }, { data: categories, error: categoriesError }] = await Promise.all([
    query, supabase.from("categories").select("*").order("name"),
  ]);
  if (productsError || categoriesError) return <main className="p-6" role="alert">Не удалось загрузить каталог.</main>;
  return <CatalogManager initialProducts={products ?? []} initialCategories={categories ?? []} userId={user.id} isAdmin={profile.role === "ADMIN"} />;
}
