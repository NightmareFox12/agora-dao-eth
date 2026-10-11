import { z } from "zod";

// Upper limits mirror the constants in Validation.sol (MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_CATEGORIES).
// If you change one of them, change it in both places. The form counters read from here too.
export const DAO_NAME_MAX_LENGTH = 50;
export const DAO_DESCRIPTION_MAX_LENGTH = 500;
export const MAX_DAO_CATEGORIES = 3;

// Lower limits are only enforced by the form.
const DAO_NAME_MIN_LENGTH = 2;
const DAO_DESCRIPTION_MIN_LENGTH = 15;

export const DaoFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(DAO_NAME_MIN_LENGTH, {
      message: `El nombre debe tener al menos ${DAO_NAME_MIN_LENGTH} caracteres.`,
    })
    .max(DAO_NAME_MAX_LENGTH, {
      message: `El nombre no puede superar los ${DAO_NAME_MAX_LENGTH} caracteres.`,
    }),

  description: z
    .string()
    .trim()
    .min(DAO_DESCRIPTION_MIN_LENGTH, {
      message: `La descripción debe tener al menos ${DAO_DESCRIPTION_MIN_LENGTH} caracteres.`,
    })
    .max(DAO_DESCRIPTION_MAX_LENGTH, {
      message: `La descripción no puede superar los ${DAO_DESCRIPTION_MAX_LENGTH} caracteres.`,
    }),

  categories: z
    .array(z.number())
    .min(1, { message: "Selecciona al menos una categoría." })
    .max(MAX_DAO_CATEGORIES, { message: `Máximo ${MAX_DAO_CATEGORIES} categorías.` }),

  logo: z
    .instanceof(File)
    .refine(file => file.type.startsWith("image/"), {
      message: "Solo se permiten archivos de imagen.",
    })
    .optional(),

  // isPublic: z.boolean(),
});
