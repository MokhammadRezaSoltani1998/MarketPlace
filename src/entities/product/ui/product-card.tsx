import type { Product } from "../model/types";
import Link from "next/link";

interface ProductCardProps {
  product: Product;
}
const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="border border-gray-200 rounded-2xl p-4 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition">
      <div>
        {/* Заглушка под картинку пока что */}
        <div className="w-full h-48 bg-gray-100 rounded-xl mb-4 flex items-center justify-center text-gray-400 text-sm">
          Фото товара
        </div>
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
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-400 block">Цена</span>
          <span className="text-xl font-bold text-gray-900">
            {product.price.toLocaleString("ru-RU")} ₽
          </span>
        </div>
        <Link
          href={`/product/${product.slug}`}
          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition"
        >
          Подробнее
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
