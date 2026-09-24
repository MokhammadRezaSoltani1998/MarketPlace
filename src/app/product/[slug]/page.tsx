import { getProductBySlug } from "@/entities/product";
import { notFound } from "next/navigation";
import Link from "next/link";
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }
  return (
    <main className="max-w-4xl mx-auto p-10">
      <Link
        href={"/"}
        className="inline-block mb-6 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        ← Назад в каталог
      </Link>
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          {product.title}
        </h1>
        <p className="text-slate-600 mb-6 text-lg">
          {product.description ?? "Описание отсутствует"}
        </p>
        <div className="text-2xl font-bold text-emerald-600">
          {product.price} ₽
        </div>
      </div>
    </main>
  );
}
