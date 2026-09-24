import { ProductCard } from "@/entities/product";
import { getProducts } from "@/entities/product";

export default async function Home() {
  const products = await getProducts();
  return (
    <div className="max-w-7xl mx-auto px-6 py-1 bg-slate-50 min-h-screen w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </div>
  );
}
