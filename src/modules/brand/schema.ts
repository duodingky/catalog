import { z } from "zod";

export const brandIdParamSchema = z.object({
  id: z.string().uuid()
});

export const createBrandBodySchema = z.object({
  brandName: z.string().min(1).max(200)
});

export const updateBrandBodySchema = z
  .object({
    brandName: z.string().min(1).max(200).optional()
  })
  .superRefine((v, ctx) => {
    if (v.brandName === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });

