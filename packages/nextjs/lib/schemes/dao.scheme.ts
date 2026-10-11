import { z } from "zod";

// must match MAX_CATEGORIES in Validation.sol
export const MAX_DAO_CATEGORIES = 3;

export const DaoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: "DAO name must be at least 2 characters.",
    })
    .max(30, {
      message: "Character limit exceeded",
    }),

  description: z
    .string()
    .trim()
    .min(15, {
      message: "Description must be at least 15 characters.",
    })
    .max(300, {
      message: "Character limit exceeded",
    }),

  categories: z
    .array(z.number())
    .min(1, { message: "Selecciona al menos una categoría." })
    .max(MAX_DAO_CATEGORIES, { message: `Máximo ${MAX_DAO_CATEGORIES} categorías.` }),

  logo: z
    .instanceof(File)
    .refine(file => file.type.startsWith("image/"), {
      message: "Only image files are allowed.",
    })
    .optional(),

  // isPublic: z.boolean(),
});
