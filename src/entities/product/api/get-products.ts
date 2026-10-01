import { createClient } from "@/shared/api/supabase/server";
import type { Product, ProductFilters } from "../model/types";

interface ProductQueryOptions {
  inStockOnly?: boolean;
}

export async function getProducts(
  filters: ProductFilters = {},
  options: ProductQueryOptions = {},
): Promise<Product[]> {
  const supabase = await createClient();
  const categorySelect = filters.category
    ? "categories!inner(name, slug)"
    : "categories(name, slug)";
  let query = supabase
    .from("products")
    .select(`*, ${categorySelect}`)
    .eq("is_active", true);
  if (options.inStockOnly) {
    query = query.gt("stock_quantity", 0);
  }
  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.category) {
    query = query.eq("categories.slug", filters.category);
  }
  if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }
  const { data, error } = await query;
  if (error) {
    console.error("Ошибка при запросе к таблице products:", error.message);
    return [];
  }
  return (data as Product[]) ?? [];
}
