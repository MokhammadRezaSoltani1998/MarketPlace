import { z } from "zod";

export const placeOrderSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(100)
    .refine((items) => new Set(items.map((item) => item.product_id)).size === items.length),
  shipping_address: z
    .record(z.string(), z.json())
    .refine((address) => Object.keys(address).length > 0),
});
