import { PICKUP_POINTS } from "../pickup-points";
import { placeOrderSchema } from "../schemas";

const productId = "c1364f45-25c5-4445-9221-8abcdb520b00";

describe("placeOrderSchema", () => {
  const items = [{ product_id: productId, quantity: 1 }];
  const contact = { name: "Анна", phone: "+7 900 000-00-00" };

  it("accepts courier delivery with a recipient and address", () => {
    const result = placeOrderSchema.safeParse({
      items,
      delivery_method: "COURIER",
      shipping_address: { ...contact, address: "Москва, ул. Тверская, 1" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts pickup at a listed point", () => {
    const result = placeOrderSchema.safeParse({
      items,
      delivery_method: "PICKUP",
      pickup_point_id: PICKUP_POINTS[0].id,
      shipping_address: contact,
    });
    expect(result.success).toBe(true);
  });

  it.each([
    { delivery_method: "COURIER", shipping_address: contact },
    { delivery_method: "COURIER", shipping_address: { ...contact, address: "   " } },
    { delivery_method: "COURIER", pickup_point_id: PICKUP_POINTS[0].id, shipping_address: { ...contact, address: "Москва" } },
    { delivery_method: "PICKUP", shipping_address: contact },
    { delivery_method: "PICKUP", pickup_point_id: "unknown", shipping_address: contact },
    { delivery_method: "PICKUP", pickup_point_id: PICKUP_POINTS[0].id, shipping_address: { ...contact, address: "Москва" } },
    { delivery_method: "PICKUP", pickup_point_id: PICKUP_POINTS[0].id, shipping_address: { ...contact, phone: " " } },
  ])("rejects incomplete or conflicting delivery details", (details) => {
    expect(placeOrderSchema.safeParse({ items, ...details }).success).toBe(false);
  });

  it("rejects duplicate products", () => {
    expect(placeOrderSchema.safeParse({
      items: [items[0], items[0]],
      delivery_method: "COURIER",
      shipping_address: { ...contact, address: "Москва" },
    }).success).toBe(false);
  });
});
