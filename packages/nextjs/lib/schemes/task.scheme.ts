import { z } from "zod";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { IMAGE_NAME_PATTERN } from "~~/lib/files";

// Limits that AgoraTasks.sol enforces too (MAX_TITLE_LENGTH, MAX_SUMMARY_LENGTH, MIN_WORK_DAYS, MAX_WORK_DAYS).
// If you change one of them, change it in both places. The form counters read from here too.
export const TASK_TITLE_MAX_LENGTH = 80;
export const TASK_SUMMARY_MAX_LENGTH = 160;
export const TASK_MIN_WORK_DAYS = 7;
export const TASK_MAX_WORK_DAYS = 30;

// Limits of what is stored in the details file: the contract does not check them.
export const TASK_DESCRIPTION_MAX_LENGTH = 5000;
export const TASK_MAX_IMAGES = 3;
export const TASK_IMAGE_MAX_BYTES = 1024 * 1024;
export const TASK_MAX_CRITERIA = 10;
export const TASK_CRITERION_MAX_LENGTH = 200;
export const TASK_MAX_LINKS = 5;
export const TASK_LINK_LABEL_MAX_LENGTH = 60;

// Lower limits are only enforced by the form.
const TASK_TITLE_MIN_LENGTH = 3;
const TASK_SUMMARY_MIN_LENGTH = 10;
const TASK_DESCRIPTION_MIN_LENGTH = 30;

/** Only web addresses are shown as links: anything else (javascript:...) is plain text. */
export const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

const LINK_MESSAGE = "Escribe un enlace válido que empiece por http:// o https://";

export const TaskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TASK_TITLE_MIN_LENGTH, { message: `El título debe tener al menos ${TASK_TITLE_MIN_LENGTH} caracteres.` })
    .max(TASK_TITLE_MAX_LENGTH, { message: `El título no puede superar los ${TASK_TITLE_MAX_LENGTH} caracteres.` }),

  summary: z
    .string()
    .trim()
    .min(TASK_SUMMARY_MIN_LENGTH, { message: `El resumen debe tener al menos ${TASK_SUMMARY_MIN_LENGTH} caracteres.` })
    .max(TASK_SUMMARY_MAX_LENGTH, {
      message: `El resumen no puede superar los ${TASK_SUMMARY_MAX_LENGTH} caracteres.`,
    }),

  category: z
    .number({ error: "Selecciona una categoría." })
    .int()
    .min(0, { message: "Selecciona una categoría." })
    .max(TASK_CATEGORIES.length - 1, { message: "Selecciona una categoría." }),

  description: z
    .string()
    .trim()
    .min(TASK_DESCRIPTION_MIN_LENGTH, {
      message: `Explica la tarea con al menos ${TASK_DESCRIPTION_MIN_LENGTH} caracteres.`,
    })
    .max(TASK_DESCRIPTION_MAX_LENGTH, {
      message: `La descripción no puede superar los ${TASK_DESCRIPTION_MAX_LENGTH} caracteres.`,
    }),

  images: z.array(z.instanceof(File)).max(TASK_MAX_IMAGES, { message: `Máximo ${TASK_MAX_IMAGES} imágenes.` }),

  // Empty rows are allowed in the form and dropped when publishing.
  criteria: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .max(TASK_CRITERION_MAX_LENGTH, {
            message: `Cada criterio puede tener hasta ${TASK_CRITERION_MAX_LENGTH} caracteres.`,
          }),
      }),
    )
    .max(TASK_MAX_CRITERIA),

  links: z
    .array(
      z.object({
        label: z.string().trim().max(TASK_LINK_LABEL_MAX_LENGTH, { message: "El nombre es demasiado largo." }),
        url: z
          .string()
          .trim()
          .refine(value => value === "" || isHttpUrl(value), { message: LINK_MESSAGE }),
      }),
    )
    .max(TASK_MAX_LINKS),

  workDays: z
    .number()
    .int()
    .min(TASK_MIN_WORK_DAYS, { message: `Mínimo ${TASK_MIN_WORK_DAYS} días.` })
    .max(TASK_MAX_WORK_DAYS, { message: `Máximo ${TASK_MAX_WORK_DAYS} días.` }),

  // ETH amount as typed by the user, e.g. "0.5"
  reward: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,18})?$/, { message: "Escribe un monto válido, por ejemplo 0.5" })
    .refine(value => Number(value) > 0, { message: "La recompensa debe ser mayor a cero." }),
});

// What the assignee and the creator write while working on a task (AgoraTasks: MAX_LINK_LENGTH, MAX_TEXT_LENGTH)
export const TASK_LINK_MAX_LENGTH = 300;
export const TASK_TEXT_MAX_LENGTH = 300;

export const TaskSubmissionSchema = z.object({
  link: z
    .string()
    .trim()
    .min(1, { message: "Pega el enlace de tu trabajo." })
    .max(TASK_LINK_MAX_LENGTH, { message: `El enlace no puede superar los ${TASK_LINK_MAX_LENGTH} caracteres.` })
    .refine(isHttpUrl, { message: LINK_MESSAGE }),
  note: z
    .string()
    .trim()
    .max(TASK_TEXT_MAX_LENGTH, { message: `La nota no puede superar los ${TASK_TEXT_MAX_LENGTH} caracteres.` }),
});

export const TaskRejectionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, { message: "Explica qué hay que cambiar (mínimo 5 caracteres)." })
    .max(TASK_TEXT_MAX_LENGTH, { message: `El motivo no puede superar los ${TASK_TEXT_MAX_LENGTH} caracteres.` }),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

/** The details file of each task. The contract only keeps its SHA-256. */
export const TaskMetadataSchema = z.object({
  version: z.literal(1),
  description: z.string().trim().min(TASK_DESCRIPTION_MIN_LENGTH).max(TASK_DESCRIPTION_MAX_LENGTH),
  /** File names of the images in the task-images bucket (their SHA-256 + extension) */
  images: z.array(z.string().regex(IMAGE_NAME_PATTERN)).max(TASK_MAX_IMAGES),
  criteria: z.array(z.string().trim().min(1).max(TASK_CRITERION_MAX_LENGTH)).max(TASK_MAX_CRITERIA),
  links: z
    .array(
      z.object({
        label: z.string().trim().max(TASK_LINK_LABEL_MAX_LENGTH),
        url: z.string().trim().refine(isHttpUrl, { message: LINK_MESSAGE }),
      }),
    )
    .max(TASK_MAX_LINKS),
});

export type TaskMetadata = z.infer<typeof TaskMetadataSchema>;
