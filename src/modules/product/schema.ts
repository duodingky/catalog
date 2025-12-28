import { z } from "zod";

export const productIdParamSchema = z.object({
  id: z.string().uuid()
});

const priceSchema = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const s = typeof v === "number" ? String(v) : v;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid price" });
    return z.NEVER;
  }
  return s;
});

export const createProductBodySchema = z.object({
  productName: z.string().min(1).max(200),
  categoryId: z.string().uuid(),
  brandId: z.string().uuid(),
  price: priceSchema,
  shortDesc: z.string().max(500).optional(),
  longDesc: z.string().max(5000).optional()
});

