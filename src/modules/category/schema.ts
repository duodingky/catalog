import { z } from "zod";

const imageUrlSchema = z
  .string()
  .url()
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "imageUrl must be a valid http/https URL"
  });

export const categoryIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createCategoryBodySchema = z.object({
  categoryName: z.string().min(1).max(200),
  imageUrl: imageUrlSchema.optional(),
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
      v.parentId !== undefined ||
      v.parentCategory !== undefined;
    if (!hasAny) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });

