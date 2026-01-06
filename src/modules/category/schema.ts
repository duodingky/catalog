import { z } from "zod";
import { paginationQueryInputSchema } from "../../shared/pagination.js";

const imageUrlSchema = z
  .string()
  .url()
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "imageUrl must be a valid http/https URL"
  });

export const categoryIdParamSchema = z.object({
  id: z.string().uuid()
});

export const categoryIdOrZeroParamSchema = z.object({
  id: z.union([z.literal("0"), z.string().uuid()])
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

export const listCategoriesQuerySchema = z
  .object({
    // Canonical spelling
    includeChildren: booleanQuerySchema.optional(),
    // Backwards/typo compatibility
    inlcudeChildren: booleanQuerySchema.optional()
  })
  .merge(paginationQueryInputSchema)
  .transform((v) => ({
    includeChildren: v.includeChildren ?? v.inlcudeChildren ?? true,
    limit: v.limit ?? 10,
    start: v.start ?? v.star ?? 0
  }))
  .superRefine((v, ctx) => {
    if (v.limit < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["limit"], message: "limit must be >= 0" });
    if (v.start < 0) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["start"], message: "start must be >= 0" });
  });

export const createCategoryBodySchema = z.object({
  categoryName: z.string().min(1).max(200),
  imageUrl: imageUrlSchema.optional(),
  featured: z.boolean().optional(),
  parentId: z.union([z.literal("0"), z.string().uuid()]).optional(),
  parentCategory: z.string().min(1).max(200).optional()
}).refine((v) => !(v.parentId && v.parentCategory), {
  message: "Provide either parentId or parentCategory, not both",
  path: ["parentId"]
});

export const updateCategoryBodySchema = z
  .object({
    categoryName: z.string().min(1).max(200).optional(),
    imageUrl: imageUrlSchema.optional(),
    featured: z.boolean().optional(),
    parentId: z.union([z.literal("0"), z.string().uuid()]).optional(),
    parentCategory: z.string().min(1).max(200).optional()
  })
  .refine((v) => !(v.parentId && v.parentCategory), {
    message: "Provide either parentId or parentCategory, not both",
    path: ["parentId"]
  })
  .superRefine((v, ctx) => {
    const hasAny =
      v.categoryName !== undefined ||
      v.imageUrl !== undefined ||
      v.featured !== undefined ||
      v.parentId !== undefined ||
      v.parentCategory !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });

