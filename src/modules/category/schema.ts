import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createCategoryBodySchema = z.object({
  categoryName: z.string().min(1).max(200),
  parentId: z.union([z.literal("0"), z.string().uuid()]).optional(),
  parentCategory: z.string().min(1).max(200).optional()
}).refine((v) => !(v.parentId && v.parentCategory), {
  message: "Provide either parentId or parentCategory, not both",
  path: ["parentId"]
});

