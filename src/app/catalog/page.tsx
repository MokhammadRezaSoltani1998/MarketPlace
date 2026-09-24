import { getProducts, ProductCard } from "@/entities/product";

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

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        Каталог товаров
      </h1>

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
