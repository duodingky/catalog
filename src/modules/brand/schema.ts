import { z } from "zod";

export const brandIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createBrandBodySchema = z.object({
  brandName: z.string().min(1).max(200)
});

