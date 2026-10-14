/** @jest-environment node */

import { POST } from "./route";
import { PICKUP_POINTS } from "@/features/checkout/model/pickup-points";

const mockGetUser = jest.fn();
const mockRpc = jest.fn();

jest.mock("@/shared/api/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mockGetUser }, rpc: mockRpc }),
}));

const items = [{ product_id: "c1364f45-25c5-4445-9221-8abcdb520b00", quantity: 1 }];
const contact = { name: "Анна", phone: "+7 900 000-00-00" };
const courierAddress = { ...contact, address: "Москва, ул. Тверская, 1" };

function post(body: unknown) {
  return POST(new Request("http://localhost/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

beforeEach(() => {
  mockGetUser.mockReset();
  mockRpc.mockReset();
  mockGetUser.mockResolvedValue({ data: { user: { id: "buyer-id" } }, error: null });
  mockRpc.mockResolvedValue({ data: "order-id", error: null });
});

it("keeps the existing checkout request on the courier RPC", async () => {
  const response = await post({ items, shipping_address: courierAddress });
  expect(response.status).toBe(201);
  expect(mockRpc).toHaveBeenCalledWith("place_order", {
    p_items: items,
    p_shipping_address: courierAddress,
  });
});

it("passes an explicit pickup point to the new RPC", async () => {
  const response = await post({
    items,
    delivery_method: "PICKUP",
    pickup_point_id: PICKUP_POINTS[0].id,
    shipping_address: contact,
  });
  expect(response.status).toBe(201);
  expect(mockRpc).toHaveBeenCalledWith("place_order", {
    p_items: items,
    p_shipping_address: contact,
    p_delivery_method: "PICKUP",
    p_pickup_point_id: PICKUP_POINTS[0].id,
  });
});

it("passes explicit courier delivery without a pickup point", async () => {
  const response = await post({ items, delivery_method: "COURIER", shipping_address: courierAddress });
  expect(response.status).toBe(201);
  expect(mockRpc).toHaveBeenCalledWith("place_order", {
    p_items: items,
    p_shipping_address: courierAddress,
    p_delivery_method: "COURIER",
    p_pickup_point_id: null,
  });
});

it("rejects an unknown pickup point before calling the database", async () => {
  const response = await post({
    items,
    delivery_method: "PICKUP",
    pickup_point_id: "unknown",
    shipping_address: contact,
  });
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ error: "Некорректный пункт выдачи" });
  expect(mockRpc).not.toHaveBeenCalled();
});

it("reports a conflicting seller as an order conflict", async () => {
  mockRpc.mockResolvedValue({ data: null, error: { message: "MULTIPLE_SELLERS_NOT_SUPPORTED" } });
  const response = await post({ items, shipping_address: courierAddress });
  expect(response.status).toBe(409);
});

it("requires an authenticated buyer", async () => {
  mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
  const response = await post({ items, shipping_address: courierAddress });
  expect(response.status).toBe(401);
  expect(mockRpc).not.toHaveBeenCalled();
});
