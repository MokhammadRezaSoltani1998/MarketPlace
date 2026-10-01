import { render, screen } from "@testing-library/react";
import type { Product } from "../../model/types";
import ProductCard from "../product-card";

const product: Product = {
  id: "product-id",
  seller_id: "seller-id",
  category_id: null,
  created_at: "2026-09-28T00:00:00Z",
  updated_at: "2026-09-28T00:00:00Z",
  description: null,
  is_active: true,
  price: 100,
  slug: "test-product",
  stock_quantity: 1,
  title: "Тестовый товар",
};

describe("ProductCard", () => {
  it("показывает наличие товара при положительном остатке", () => {
    render(<ProductCard product={product} />);

    expect(screen.getByText("В наличии")).toBeInTheDocument();
  });

  it("оставляет товар без остатка видимым и доступным по ссылке", () => {
    render(<ProductCard product={{ ...product, stock_quantity: 0 }} />);

    expect(screen.getByText("Тестовый товар")).toBeInTheDocument();
    expect(screen.getByText("Нет в наличии")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Подробнее" })).toHaveAttribute(
      "href",
      "/product/test-product",
    );
  });
});
