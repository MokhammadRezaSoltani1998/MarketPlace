import { z } from "zod";

export const productSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),
  description: z.string().trim().max(5000),
  price: z.coerce.number<number>().positive(),
  stock_quantity: z.coerce.number<number>().int().min(0),
  category_id: z.union([z.uuid(), z.literal("")]),
  is_active: z.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),
});
