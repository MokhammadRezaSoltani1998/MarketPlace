import { categorySchema, productSchema } from "../schemas";

const product = {
  title: "Товар",
  slug: "test-product",
  description: "Описание",
  price: "100.50",
  stock_quantity: "2",
  category_id: "",
  is_active: true,
};

describe("catalog schemas", () => {
  it("accepts a product with numeric form fields and no category", () => {
    const result = productSchema.safeParse(product);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(100.5);
      expect(result.data.stock_quantity).toBe(2);
    }
  });

  it.each([
    { ...product, price: "-1" },
    { ...product, stock_quantity: "1.5" },
    { ...product, slug: "Bad Slug" },
  ])("rejects invalid product fields", (input) => {
    expect(productSchema.safeParse(input).success).toBe(false);
  });

  it("requires a valid category slug", () => {
    expect(categorySchema.safeParse({ name: "Обувь", slug: "shoes" }).success).toBe(true);
    expect(categorySchema.safeParse({ name: "Обувь", slug: "Bad Slug" }).success).toBe(false);
  });
});
