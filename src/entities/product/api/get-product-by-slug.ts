import { createClient } from "@/shared/api/supabase/server";

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data: slugData, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("Ошибка при запросе к БД по slug", error.message);
    return null; 
  }
  return slugData;
}
