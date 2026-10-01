import { placeOrderSchema } from "../schemas";

const productId = "c1364f45-25c5-4445-9221-8abcdb520b00";
const address = { city: "Екатеринбург" };

describe("placeOrderSchema", () => {
  it("accepts a valid order request", () => {
    expect(
      placeOrderSchema.safeParse({
        items: [{ product_id: productId, quantity: 1 }],
        shipping_address: address,
      }).success,
    ).toBe(true);
  });

  it.each([
    { items: [], shipping_address: address },
    { items: [{ product_id: productId, quantity: 0 }], shipping_address: address },
    { items: [{ product_id: productId, quantity: 1.5 }], shipping_address: address },
    {
      items: [
        { product_id: productId, quantity: 1 },
        { product_id: productId, quantity: 1 },
      ],
      shipping_address: address,
    },
    { items: [{ product_id: productId, quantity: 1 }], shipping_address: {} },
  ])("rejects invalid order data", (request) => {
    expect(placeOrderSchema.safeParse(request).success).toBe(false);
  });
});
