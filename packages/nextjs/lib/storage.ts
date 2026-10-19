import { sha256Hex } from "~~/lib/files";
import { type TaskMetadata, TaskMetadataSchema } from "~~/lib/schemes/task.scheme";

// Everything that reads an uploaded file goes through this file, so changing where files are stored only
// means changing it. Today they live in Supabase Storage: public buckets, read through its CDN. Nothing is
// written from the browser: uploads go through /api/upload, which checks a wallet signature first.
export const BUCKETS = {
  logos: "dao-logos",
  taskImages: "task-images",
  taskDetails: "task-details",
  eventCovers: "event-covers",
  eventDetails: "event-details",
} as const;

const publicUrl = (bucket: string, name: string) =>
  `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/+$/, "")}/storage/v1/object/public/${bucket}/${name}`;

/** Logo of a DAO, given the file name stored on-chain. */
export const getLogoUrl = (name: string) => publicUrl(BUCKETS.logos, name);

export const getTaskImageUrl = (name: string) => publicUrl(BUCKETS.taskImages, name);

export const getEventCoverUrl = (name: string) => publicUrl(BUCKETS.eventCovers, name);

/**
 * Reads the details of a task and checks them against the hash the contract holds: if the file is not exactly
 * what was agreed when the task was published, it is not shown. Anyone can point a task at any file, so the
 * content is also checked against the expected format.
 *
 * @param hash the `metadataHash` of the task (0x + 64 hexadecimal characters)
 */
export const fetchTaskMetadata = async (hash: string): Promise<TaskMetadata> => {
  const expected = hash.replace(/^0x/, "").toLowerCase();

  const response = await fetch(publicUrl(BUCKETS.taskDetails, `${expected}.json`), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`No se pudieron leer los detalles (error ${response.status}).`);

  const bytes = await response.arrayBuffer();
  if ((await sha256Hex(bytes)) !== expected) {
    throw new Error(
      "El contenido de esta tarea no coincide con lo que se acordó al publicarla, así que no se muestra.",
    );
  }

  const metadata = TaskMetadataSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
  if (!metadata.success) throw new Error("Los detalles de esta tarea no tienen el formato esperado.");

  return metadata.data;
};

/** Reads the extended details of an event. Returns undefined for events without metadata (hash = 0x00). */
export const fetchEventMetadata = async (hash: string) => {
  const expected = hash.replace(/^0x/, "").toLowerCase();
  if (/^0+$/.test(expected)) return undefined;

  const { EventMetadataSchema } = await import("~~/lib/schemes/event.scheme");

  const response = await fetch(publicUrl(BUCKETS.eventDetails, `${expected}.json`), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`No se pudieron leer los detalles (error ${response.status}).`);

  const bytes = await response.arrayBuffer();
  if ((await sha256Hex(bytes)) !== expected) {
    throw new Error("El contenido de este evento no coincide con lo que se publicó, así que no se muestra.");
  }

  const metadata = EventMetadataSchema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
  if (!metadata.success) throw new Error("Los detalles de este evento no tienen el formato esperado.");

  return metadata.data;
};
