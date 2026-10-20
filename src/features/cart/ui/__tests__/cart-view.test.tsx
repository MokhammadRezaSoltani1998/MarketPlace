import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PICKUP_POINTS } from "@/features/checkout/model/pickup-points";
import type { CartLine } from "../../model/cart";
import CartView from "../cart-view";

const mockLoadCart = jest.fn();
const mockReplace = jest.fn();
const mockRefresh = jest.fn();
const mockDeleteCart = jest.fn();

jest.mock("../../model/cart", () => ({
  loadCart: (...args: unknown[]) => mockLoadCart(...args),
  setCartQuantity: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

jest.mock("@/shared/api/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ delete: () => ({ eq: mockDeleteCart }) }),
  }),
}));

const line: CartLine = {
  product: {
    id: "c1364f45-25c5-4445-9221-8abcdb520b00",
    category_id: null,
    created_at: "2026-10-01T00:00:00Z",
    description: null,
    is_active: true,
    price: 100,
    seller_id: "81677213-011b-4629-a66c-474a8b697a93",
    slug: "test-product",
    stock_quantity: 2,
    title: "Товар",
    updated_at: "2026-10-01T00:00:00Z",
  },
  quantity: 1,
};

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeAll(() => { global.fetch = mockFetch; });
afterAll(() => { global.fetch = originalFetch; });

beforeEach(() => {
  jest.clearAllMocks();
  mockLoadCart.mockResolvedValue([line]);
  mockDeleteCart.mockResolvedValue({ error: null });
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ order_id: "order-id" }) });
});

async function fillContact() {
  const user = userEvent.setup();
  render(<CartView userId="buyer-id" checkout />);
  await screen.findByText("Товар");
  await user.type(screen.getByRole("textbox", { name: "Имя" }), " Анна ");
  await user.type(screen.getByRole("textbox", { name: "Телефон" }), " +7 900 000-00-00 ");
  return user;
}

it("sends only courier delivery details and opens the created order", async () => {
  const user = await fillContact();
  await user.type(screen.getByRole("textbox", { name: "Адрес доставки" }), " Москва, ул. Тверская, 1 ");
  await user.click(screen.getByRole("button", { name: "Создать заказ" }));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/orders/order-id"));
  expect(mockFetch).toHaveBeenCalledWith("/api/orders", expect.objectContaining({
    body: JSON.stringify({
      items: [{ product_id: line.product.id, quantity: 1 }],
      delivery_method: "COURIER",
      shipping_address: { name: "Анна", phone: "+7 900 000-00-00", address: "Москва, ул. Тверская, 1" },
    }),
  }));
  expect(mockRefresh).toHaveBeenCalled();
});

it("sends only pickup delivery details and opens the created order", async () => {
  const user = await fillContact();
  await user.click(screen.getByRole("radio", { name: "Самовывоз" }));
  await user.selectOptions(screen.getByRole("combobox", { name: "Город" }), "Москва");
  await user.selectOptions(screen.getByRole("combobox", { name: "Пункт выдачи" }), PICKUP_POINTS[0].id);
  await user.click(screen.getByRole("button", { name: "Создать заказ" }));

  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/orders/order-id"));
  expect(mockFetch).toHaveBeenCalledWith("/api/orders", expect.objectContaining({
    body: JSON.stringify({
      items: [{ product_id: line.product.id, quantity: 1 }],
      delivery_method: "PICKUP",
      pickup_point_id: PICKUP_POINTS[0].id,
      shipping_address: { name: "Анна", phone: "+7 900 000-00-00" },
    }),
  }));
});

it("requires contact details and a courier address", async () => {
  const user = userEvent.setup();
  render(<CartView userId="buyer-id" checkout />);
  await screen.findByText("Товар");

  const submit = screen.getByRole("button", { name: "Создать заказ" });
  await user.click(submit);
  expect(mockFetch).not.toHaveBeenCalled();

  await user.type(screen.getByRole("textbox", { name: "Имя" }), "Анна");
  await user.type(screen.getByRole("textbox", { name: "Телефон" }), "+7 900 000-00-00");
  await user.click(submit);
  expect(mockFetch).not.toHaveBeenCalled();

  await user.type(screen.getByRole("textbox", { name: "Адрес доставки" }), "Москва");
  await user.click(submit);
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
});

it("keeps shared contact fields and resets the pickup point when the city changes", async () => {
  const user = await fillContact();
  await user.type(screen.getByRole("textbox", { name: "Адрес доставки" }), "Москва, ул. Тверская, 1");
  await user.click(screen.getByRole("radio", { name: "Самовывоз" }));

  expect(screen.queryByRole("textbox", { name: "Адрес доставки" })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Имя" })).toHaveValue(" Анна ");
  expect(screen.getByRole("textbox", { name: "Телефон" })).toHaveValue(" +7 900 000-00-00 ");
  const city = screen.getByRole("combobox", { name: "Город" });
  const point = screen.getByRole("combobox", { name: "Пункт выдачи" });
  const submit = screen.getByRole("button", { name: "Создать заказ" });
  expect(point).toBeDisabled();
  expect(submit).toBeDisabled();

  await user.selectOptions(city, "Москва");
  expect(point).toBeEnabled();
  expect(submit).toBeDisabled();
  await user.selectOptions(point, PICKUP_POINTS[0].id);
  expect(submit).toBeEnabled();

  await user.selectOptions(city, "Санкт-Петербург");
  expect(point).toHaveValue("");
  expect(submit).toBeDisabled();
  expect(screen.queryByRole("option", { name: `${PICKUP_POINTS[0].provider} — ${PICKUP_POINTS[0].address}` })).not.toBeInTheDocument();
  expect(mockFetch).not.toHaveBeenCalled();

  await user.click(screen.getByRole("radio", { name: "Курьер" }));
  expect(screen.getByRole("textbox", { name: "Адрес доставки" })).toHaveValue("Москва, ул. Тверская, 1");
  expect(submit).toBeEnabled();
});

it("shows the API error without leaving checkout", async () => {
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Товар недоступен или закончился" }) });
  const user = await fillContact();
  await user.type(screen.getByRole("textbox", { name: "Адрес доставки" }), "Москва");
  await user.click(screen.getByRole("button", { name: "Создать заказ" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("Товар недоступен или закончился");
  expect(mockReplace).not.toHaveBeenCalled();
});
