import { z } from "zod";
import { PICKUP_POINTS } from "./pickup-points";

const orderItemsSchema = z
  .array(
    z.object({
      product_id: z.uuid(),
      quantity: z.number().int().positive(),
    }),
  )
  .min(1)
  .max(100)
  .refine((items) => new Set(items.map((item) => item.product_id)).size === items.length);

const contactFields = {
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(30),
};

export const placeOrderSchema = z.discriminatedUnion("delivery_method", [
  z.strictObject({
    items: orderItemsSchema,
    delivery_method: z.literal("COURIER"),
    shipping_address: z.strictObject({
      ...contactFields,
      address: z.string().trim().min(1).max(500),
    }),
  }),
  z.strictObject({
    items: orderItemsSchema,
    delivery_method: z.literal("PICKUP"),
    pickup_point_id: z.string().refine((id) => PICKUP_POINTS.some((point) => point.id === id)),
    shipping_address: z.strictObject(contactFields),
  }),
]);
