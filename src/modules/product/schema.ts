import { z } from "zod";

export const productIdParamSchema = z.object({
  id: z.string().uuid()
});

const imageUrlSchema = z
  .string()
  .url()
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "imageUrl must be a valid http/https URL"
  });

const priceSchema = z.union([z.number(), z.string()]).transform((v, ctx) => {
  const s = typeof v === "number" ? String(v) : v;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid price" });
    return z.NEVER;
  }
  return s;
});

const brandFieldsSchema = z
  .object({
    brandId: z.string().uuid().optional(),
    brandName: z.string().min(1).max(200).optional(),
    // common misspelling support
    branndName: z.string().min(1).max(200).optional()
  })
  .transform((v) => ({
    brandId: v.brandId,
    brandName: v.brandName ?? v.branndName
  }));

export const createProductBodySchema = z
  .object({
    productName: z.string().min(1).max(200),
    categoryId: z.string().uuid(),
    price: priceSchema,
    imageUrl: imageUrlSchema.optional(),
    shortDesc: z.string().max(500).optional(),
    longDesc: z.string().max(5000).optional()
  })
  .and(brandFieldsSchema)
  .superRefine((v, ctx) => {
    if (!v.brandId && !v.brandName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["brandId"],
        message: "Provide brandId or brandName"
      });
    }
  });

export const updateProductBodySchema = z
  .object({
    productName: z.string().min(1).max(200).optional(),
    categoryId: z.string().uuid().optional(),
    price: priceSchema.optional(),
    imageUrl: imageUrlSchema.optional(),
    shortDesc: z.string().max(500).optional(),
    longDesc: z.string().max(5000).optional()
  })
  .and(brandFieldsSchema)
  .superRefine((v, ctx) => {
    const hasAny =
      v.productName !== undefined ||
      v.categoryId !== undefined ||
      v.price !== undefined ||
      v.imageUrl !== undefined ||
      v.shortDesc !== undefined ||
      v.longDesc !== undefined ||
      v.brandId !== undefined ||
      v.brandName !== undefined;

    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one field to update"
      });
    }
  });

