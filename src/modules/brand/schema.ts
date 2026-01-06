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
  featured: z.boolean().optional()
});

export const updateBrandBodySchema = z
  .object({
    brandName: z.string().min(1).max(200).optional(),
    imageUrl: imageUrlSchema.optional(),
    featured: z.boolean().optional()
  })
  .superRefine((v, ctx) => {
    if (v.brandName === undefined && v.imageUrl === undefined && v.featured === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });

export const listBrandsQuerySchema = paginationQueryInputSchema
  .transform((v) => ({
    limit: v.limit ?? 10,
    start: v.start ?? v.star ?? 0
  }))
  .superRefine((v, ctx) => {
    if (v.limit < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["limit"], message: "limit must be >= 0" });
    if (v.start < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["start"], message: "start must be >= 0" });
  });

