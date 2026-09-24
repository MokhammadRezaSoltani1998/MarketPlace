import { Database } from "@/shared/api/supabase/database.types";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export type Product = ProductRow & {
  categories?: Pick<CategoryRow, "name" | "slug"> | null;
};

export interface ProductFilters {
  search?: string;
  category?: string;
  sort?: "price_asc" | "price_desc" | "newest";
}
