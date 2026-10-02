import { ProductCard } from "@/entities/product";
import { getProducts } from "@/entities/product";
import AddToCartButton from "@/features/cart/ui/add-to-cart-button";

export default async function Home() {
  const products = await getProducts({}, { inStockOnly: true });
  return (
    <div className="max-w-7xl mx-auto px-6 py-1 bg-slate-50 min-h-screen w-full">
      {products.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          Товаров в наличии пока нет.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard product={product} key={product.id} action={<AddToCartButton productId={product.id} stock={product.stock_quantity} />} />
          ))}
        </div>
      )}
    </div>
  );
}
