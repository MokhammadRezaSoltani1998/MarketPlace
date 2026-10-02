import { getProducts, ProductCard } from "@/entities/product";
import { createClient } from "@/shared/api/supabase/server";

interface CatalogPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: "price_asc" | "price_desc" | "newest";
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const filters = await searchParams;
  const products = await getProducts(filters);
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("name, slug").order("name");

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Каталог товаров
      </h1>

      <form className="mb-8 flex flex-wrap gap-3" action="/catalog">
        <input name="search" aria-label="Поиск" defaultValue={filters.search ?? ""} placeholder="Поиск товаров" className="rounded border p-2" />
        <select name="category" aria-label="Категория" defaultValue={filters.category ?? ""} className="rounded border p-2"><option value="">Все категории</option>{categories?.map((category) => <option value={category.slug} key={category.slug}>{category.name}</option>)}</select>
        <select name="sort" aria-label="Сортировка" defaultValue={filters.sort ?? "newest"} className="rounded border p-2"><option value="newest">Сначала новые</option><option value="price_asc">Сначала дешёвые</option><option value="price_desc">Сначала дорогие</option></select>
        <button className="rounded bg-black px-4 py-2 text-white">Применить</button>
      </form>

      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Товары не найдены. Попробуйте изменить параметры поиска.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
