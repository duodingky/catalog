import { z } from "zod";
import { paginationQueryInputSchema } from "../../shared/pagination.js";

const imageUrlSchema = z
  .string()
  .url()
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "imageUrl must be a valid http/https URL"
  });

export const brandIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createBrandBodySchema = z.object({
  brandName: z.string().min(1).max(200),
  imageUrl: imageUrlSchema.optional(),
  featured: z.boolean().optional(),
  shortDesc: z.string().max(500).optional(),
  longDesc: z.string().max(5000).optional()
});

export const updateBrandBodySchema = z
  .object({
    brandName: z.string().min(1).max(200).optional(),
    imageUrl: imageUrlSchema.optional(),
    featured: z.boolean().optional(),
    shortDesc: z.string().max(500).optional(),
    longDesc: z.string().max(5000).optional()
  })
  .superRefine((v, ctx) => {
    if (
      v.brandName === undefined &&
      v.imageUrl === undefined &&
      v.featured === undefined &&
      v.shortDesc === undefined &&
      v.longDesc === undefined
    ) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
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

export const listBrandsQuerySchema = z
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

