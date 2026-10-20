import { render, screen } from "@testing-library/react";
import { PICKUP_POINTS } from "@/features/checkout/model/pickup-points";
import type { CheckoutDatabase } from "@/features/checkout/model/types";
import OrderPage from "./page";

const mockMaybeSingle = jest.fn();

jest.mock("@/shared/api/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "buyer-id" } } }) },
    from: (table: string) => table === "orders"
      ? { select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }) }
      : { select: () => ({ eq: async () => ({ data: [] }) }) },
  }),
}));

type OrderFixture = Pick<CheckoutDatabase["public"]["Tables"]["orders"]["Row"],
  "id" | "status" | "total_amount" | "delivery_method" | "pickup_point_id" | "shipping_address">;

const baseOrder: OrderFixture = {
  id: "order-id",
  status: "PAID",
  total_amount: 100,
  delivery_method: "COURIER",
  pickup_point_id: null,
  shipping_address: { name: "Анна", phone: "+7 900 000-00-00", address: "Москва, ул. Тверская, 1" },
};

async function renderOrder(order: OrderFixture) {
  mockMaybeSingle.mockResolvedValue({ data: order, error: null });
  render(await OrderPage({ params: Promise.resolve({ id: order.id }) }));
}

afterEach(() => { jest.clearAllMocks(); });

it("shows the courier address", async () => {
  await renderOrder(baseOrder);

  expect(screen.getByText("Способ получения: Курьер")).toBeInTheDocument();
  expect(screen.getByText("Адрес доставки: Москва, ул. Тверская, 1")).toBeInTheDocument();
});

it("shows the city and address of a pickup point", async () => {
  const point = PICKUP_POINTS[0];
  await renderOrder({ ...baseOrder, delivery_method: "PICKUP", pickup_point_id: point.id });

  expect(screen.getByText("Способ получения: Самовывоз")).toBeInTheDocument();
  expect(screen.getByText(`Город: ${point.city}`)).toBeInTheDocument();
  expect(screen.getByText(`Пункт выдачи: ${point.provider}, ${point.address}`)).toBeInTheDocument();
});

it.each([null, "retired-point"])("shows a fallback when a historical pickup point is unavailable: %s", async (pickupPointId) => {
  await renderOrder({ ...baseOrder, delivery_method: "PICKUP", pickup_point_id: pickupPointId });

  expect(screen.getByText("Способ получения: Самовывоз")).toBeInTheDocument();
  expect(screen.getByText("Данные пункта выдачи недоступны.")).toBeInTheDocument();
});
