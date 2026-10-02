"use client";

import { createClient } from "@/shared/api/supabase/client";
import type { Database } from "@/shared/api/supabase/database.types";
import { categorySchema, productSchema } from "../model/schemas";
import ProductImage from "@/entities/product/ui/product-image";
import { useState } from "react";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];

function ProductForm({ product, categories, onSaved, userId }: { product?: Product; categories: Category[]; onSaved: (product: Product) => void; userId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageVersion, setImageVersion] = useState(0);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = productSchema.safeParse({
      title: data.get("title"), slug: data.get("slug"), description: data.get("description"),
      price: data.get("price"), stock_quantity: data.get("stock_quantity"),
      category_id: data.get("category_id"), is_active: data.get("is_active") === "on",
    });
    if (!parsed.success) { setMessage("Проверьте поля товара: slug — латинские буквы, цифры и дефис."); return; }
    const file = data.get("image");
    if (file instanceof File && file.size > 0 && (!file.type.match(/^image\/(jpeg|png|webp)$/) || file.size > 5_000_000)) {
      setMessage("Фото должно быть JPG, PNG или WebP до 5 МБ."); return;
    }
    setBusy(true);
    setMessage("");
    const supabase = createClient();
    const values = { ...parsed.data, category_id: parsed.data.category_id || null, description: parsed.data.description || null };
    const result = product
      ? await supabase.from("products").update(values).eq("id", product.id).select().single()
      : await supabase.from("products").insert({ ...values, seller_id: userId }).select().single();
    if (result.error || !result.data) {
      setMessage(result.error?.message ?? "Не удалось сохранить товар");
      setBusy(false);
      return;
    }
    if (file instanceof File && file.size > 0) {
      const { error } = await supabase.storage.from("product-images").upload(`${result.data.id}/cover`, file, { upsert: true, contentType: file.type });
      if (error) setMessage(`Товар сохранён, но фото не загружено: ${error.message}`);
      else { setImageVersion(Date.now()); setMessage("Товар и фото сохранены"); }
    } else setMessage("Товар сохранён");
    onSaved(result.data);
    if (!product) form.reset();
    setBusy(false);
  }

  return <form onSubmit={save} className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
    {product && <ProductImage key={imageVersion} id={product.id} title={product.title} version={imageVersion} className="h-32 w-40 rounded" />}
    <label>Название<input name="title" required maxLength={150} defaultValue={product?.title} className="block w-full rounded border p-2" /></label>
    <label>Slug<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={product?.slug} className="block w-full rounded border p-2" /></label>
    <label>Цена, ₽<input name="price" type="number" min="0.01" step="0.01" required defaultValue={product?.price} className="block w-full rounded border p-2" /></label>
    <label>Остаток<input name="stock_quantity" type="number" min="0" step="1" required defaultValue={product?.stock_quantity ?? 0} className="block w-full rounded border p-2" /></label>
    <label>Категория<select name="category_id" defaultValue={product?.category_id ?? ""} className="block w-full rounded border p-2"><option value="">Без категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
    <label>Фото<input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full rounded border p-2" /></label>
    <label className="sm:col-span-2">Описание<textarea name="description" maxLength={5000} defaultValue={product?.description ?? ""} className="block w-full rounded border p-2" /></label>
    <label><input name="is_active" type="checkbox" defaultChecked={product?.is_active ?? false} /> Опубликован</label>
    <div><button disabled={busy} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">{product ? "Сохранить" : "Добавить товар"}</button>{message && <p role="status" className="mt-2 text-sm">{message}</p>}</div>
  </form>;
}

export default function CatalogManager({ initialProducts, initialCategories, userId, isAdmin }: { initialProducts: Product[]; initialCategories: Category[]; userId: string; isAdmin: boolean }) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [categoryMessage, setCategoryMessage] = useState("");

  function onSaved(saved: Product) {
    setProducts((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
  }

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const parsed = categorySchema.safeParse({ name: data.get("name"), slug: data.get("slug") });
    if (!parsed.success) { setCategoryMessage("Укажите название и корректный slug."); return; }
    const { data: category, error } = await createClient().from("categories").insert(parsed.data).select().single();
    if (error || !category) { setCategoryMessage(error?.message ?? "Не удалось добавить категорию"); return; }
    setCategories((current) => [...current, category]);
    form.reset();
    setCategoryMessage("Категория добавлена");
  }

  async function updateCategory(category: Category, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = categorySchema.safeParse({ name: data.get("name"), slug: data.get("slug") });
    if (!parsed.success) { setCategoryMessage("Укажите название и корректный slug."); return; }
    const { data: updated, error } = await createClient().from("categories").update(parsed.data).eq("id", category.id).select().single();
    if (error || !updated) { setCategoryMessage(error?.message ?? "Не удалось изменить категорию"); return; }
    setCategories((current) => current.map((item) => item.id === updated.id ? updated : item));
    setCategoryMessage("Категория сохранена");
  }

  return <main className="mx-auto w-full max-w-5xl p-6"><h1 className="mb-6 text-3xl font-bold">Управление каталогом</h1>
    {isAdmin && <section className="mb-8"><h2 className="mb-3 text-xl font-semibold">Категории</h2><form onSubmit={createCategory} className="flex flex-wrap gap-3"><input name="name" required placeholder="Название" className="rounded border p-2" /><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="slug" className="rounded border p-2" /><button className="rounded bg-black px-4 py-2 text-white">Добавить</button></form>{categoryMessage && <p role="status">{categoryMessage}</p>}<div className="mt-3 space-y-2">{categories.map((category) => <details key={category.id} className="rounded border p-2"><summary className="cursor-pointer">{category.name}</summary><form onSubmit={(event) => updateCategory(category, event)} className="mt-2 flex flex-wrap gap-2"><input name="name" required defaultValue={category.name} className="rounded border p-2" /><input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={category.slug} className="rounded border p-2" /><button className="rounded bg-black px-4 py-2 text-white">Сохранить</button></form></details>)}</div></section>}
    <section><h2 className="mb-3 text-xl font-semibold">Новый товар</h2><ProductForm categories={categories} onSaved={onSaved} userId={userId} /></section>
    <section className="mt-8"><h2 className="mb-3 text-xl font-semibold">Товары</h2><div className="space-y-3">{products.map((product) => <details key={product.id} className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">{product.title} — {product.is_active ? "опубликован" : "черновик"}</summary><div className="mt-4"><ProductForm product={product} categories={categories} onSaved={onSaved} userId={userId} /></div></details>)}</div></section>
  </main>;
}
