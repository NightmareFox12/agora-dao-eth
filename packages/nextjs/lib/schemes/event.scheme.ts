import { z } from "zod";
import { IMAGE_NAME_PATTERN } from "~~/lib/files";

// Limits that AgoraEvents.sol enforces too (MAX_TITLE_LENGTH, MAX_SUMMARY_LENGTH, MAX_LOCATION_LENGTH).
// If you change one of them, change it in both places. The form counters read from here too.
export const EVENT_TITLE_MAX_LENGTH = 100;
export const EVENT_SUMMARY_MAX_LENGTH = 300;
export const EVENT_LOCATION_MAX_LENGTH = 200;
export const EVENT_MIN_LEAD_HOURS = 1;
export const EVENT_MAX_FUTURE_DAYS = 730;

// Limits of what is stored in the details file: the contract does not check them.
export const EVENT_DESCRIPTION_MAX_LENGTH = 5000;

// Lower limits are only enforced by the form.
const EVENT_TITLE_MIN_LENGTH = 5;
const EVENT_SUMMARY_MIN_LENGTH = 15;

/**
 * Form the user fills in to create an event. The description is optional: without it, no file is uploaded
 * and the event has `metadataHash = 0x00` on-chain.
 */
export const EventFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(EVENT_TITLE_MIN_LENGTH, { message: `El título debe tener al menos ${EVENT_TITLE_MIN_LENGTH} caracteres.` })
    .max(EVENT_TITLE_MAX_LENGTH, { message: `El título no puede superar los ${EVENT_TITLE_MAX_LENGTH} caracteres.` }),

  summary: z
    .string()
    .trim()
    .min(EVENT_SUMMARY_MIN_LENGTH, {
      message: `El resumen debe tener al menos ${EVENT_SUMMARY_MIN_LENGTH} caracteres.`,
    })
    .max(EVENT_SUMMARY_MAX_LENGTH, {
      message: `El resumen no puede superar los ${EVENT_SUMMARY_MAX_LENGTH} caracteres.`,
    }),

  location: z
    .string()
    .trim()
    .min(1, { message: "Dinos dónde es (o pon un enlace si es online)." })
    .max(EVENT_LOCATION_MAX_LENGTH, {
      message: `La ubicación no puede superar los ${EVENT_LOCATION_MAX_LENGTH} caracteres.`,
    }),

  /** Local date-time string (yyyy-MM-ddTHH:mm). Converted to a unix timestamp when sending to the contract. */
  startsAt: z.string().refine(value => value.length > 0 && !Number.isNaN(Date.parse(value)), {
    message: "Elige una fecha y hora válidas.",
  }),

  /** 0 = sin límite */
  maxAttendees: z.number().int().min(0, { message: "La capacidad no puede ser negativa." }),

  description: z
    .string()
    .trim()
    .max(EVENT_DESCRIPTION_MAX_LENGTH, {
      message: `La descripción no puede superar los ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres.`,
    }),

  cover: z.instanceof(File).optional(),
});

export type EventFormValues = z.infer<typeof EventFormSchema>;

/** JSON file stored in Supabase for events that have an extended description. */
export const EventMetadataSchema = z.object({
  version: z.literal(1),
  description: z.string().trim().min(1).max(EVENT_DESCRIPTION_MAX_LENGTH),
  /** File name of the cover in the event-covers bucket (SHA-256 + extension), or null if none */
  cover: z.string().regex(IMAGE_NAME_PATTERN).nullable(),
});

export type EventMetadata = z.infer<typeof EventMetadataSchema>;
