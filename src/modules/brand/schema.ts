import { z } from "zod";

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
  imageUrl: imageUrlSchema.optional()
});

export const updateBrandBodySchema = z
  .object({
    brandName: z.string().min(1).max(200).optional(),
    imageUrl: imageUrlSchema.optional()
  })
  .superRefine((v, ctx) => {
    if (v.brandName === undefined && v.imageUrl === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide at least one field to update" });
    }
  });

