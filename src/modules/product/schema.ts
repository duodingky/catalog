import { z } from "zod";
import { paginationQueryInputSchema } from "../../shared/pagination.js";

export const productIdParamSchema = z.object({
  id: z.string().uuid()
});

export const categoryIdParamSchema = z.object({
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
    featured: z.boolean().optional(),
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
    featured: z.boolean().optional(),
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
      v.featured !== undefined ||
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

export const productSearchBodySchema = z
  .object({
    q: z.string().min(1).max(200).optional(),
    query: z.string().min(1).max(200).optional(),
    category: z.string().min(1).max(200).optional(),
    brand: z
      .union([z.string().min(1).max(200), z.array(z.string().min(1).max(200))])
      .optional()
  })
  .transform((v) => {
    const brandValues = (Array.isArray(v.brand) ? v.brand : v.brand ? [v.brand] : [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    return {
      q: (v.q ?? v.query ?? "").trim(),
      category: (v.category ?? "").trim(),
      brand: brandValues
    };
  })
  .superRefine((v, ctx) => {
    const hasAny = Boolean(v.q || v.category || v.brand.length > 0);
    if (!hasAny) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one of q, category, or brand"
      });
    }
  });

const booleanQuerySchema = z.preprocess((v) => {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lowered = v.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return v;
}, z.boolean());

export const listProductsQuerySchema = z
  .object({
    featured: booleanQuerySchema.optional()
  })
  .merge(paginationQueryInputSchema)
  .transform((v) => ({
    featured: v.featured,
    limit: v.limit ?? 10,
    start: v.start ?? v.star ?? 0
  }))
  .superRefine((v, ctx) => {
    if (v.limit < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["limit"], message: "limit must be >= 0" });
    if (v.start < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["start"], message: "start must be >= 0" });
  });

