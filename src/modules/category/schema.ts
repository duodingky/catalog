import { z } from "zod";

export const categoryIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createCategoryBodySchema = z.object({
  categoryName: z.string().min(1).max(200)
});

