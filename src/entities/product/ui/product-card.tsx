import type { Product } from "../model/types";
import Link from "next/link";
import ProductImage from "./product-image";
import type { ReactNode } from "react";

interface ProductCardProps {
  product: Product;
  action?: ReactNode;
}
const ProductCard = ({ product, action }: ProductCardProps) => {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition">
      <div>
        <ProductImage id={product.id} title={product.title} className="mb-4 h-48 w-full rounded-xl" />
        {product.categories && (
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
            {product.categories.name}
          </span>
        )}
        <h3 className="text-lg font-bold text-gray-900 mt-1 line-clamp-1">
          {product.title}
        </h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
          {product.description}
        </p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-gray-400 block">Цена</span>
          <span className="text-xl font-bold text-gray-900">
            {product.price.toLocaleString("ru-RU")} ₽
          </span>
          <p
            className={`mt-1 text-sm font-medium ${product.stock_quantity > 0 ? "text-emerald-700" : "text-red-600"}`}
          >
            {product.stock_quantity > 0 ? "В наличии" : "Нет в наличии"}
          </p>
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
        >
          Подробнее
        </Link>
        {action}
      </div>
    </div>
  );
};

export default ProductCard;
