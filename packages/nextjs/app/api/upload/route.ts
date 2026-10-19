import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { http } from "viem";
import { createPublicClient } from "viem";
import type { Address } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { DETAILS_MAX_BYTES, IMAGE_MAX_BYTES, detectImageType, sha256Hex } from "~~/lib/files";
import { EventMetadataSchema } from "~~/lib/schemes/event.scheme";
import { TaskMetadataSchema } from "~~/lib/schemes/task.scheme";
import { authorizeUpload, createChainReader } from "~~/lib/server/uploadAuthorization";
import { BUCKETS } from "~~/lib/storage";
import scaffoldConfig from "~~/scaffold.config";

// Where each kind of file goes, and which signature covers it
const KINDS = {
  logo: { bucket: BUCKETS.logos, action: "logo" },
  "task-image": { bucket: BUCKETS.taskImages, action: "task" },
  "task-details": { bucket: BUCKETS.taskDetails, action: "task" },
  "event-cover": { bucket: BUCKETS.eventCovers, action: "event" },
  "event-details": { bucket: BUCKETS.eventDetails, action: "event" },
} as const;

type Kind = keyof typeof KINDS;

const fail = (status: number, message: string) => NextResponse.json({ message }, { status });

/**
 * Saves a file in Supabase Storage. The browser never talks to Supabase: it sends the file here together with a
 * wallet signature, and only this route (which holds the secret key) writes.
 *
 * Files are named after their SHA-256, so a file can never be replaced by a different one.
 */
export const POST = async (request: NextRequest) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseKey) return fail(500, "El servidor no tiene configurado Supabase.");

  try {
    const form = await request.formData();

    const kind = form.get("kind");
    const file = form.get("file");
    if (typeof kind !== "string" || !(kind in KINDS)) return fail(400, "Tipo de archivo no válido.");
    if (!(file instanceof File)) return fail(400, "No se recibió ningún archivo.");

    const isDetails = kind === "task-details" || kind === "event-details";
    if (isDetails ? file.size > DETAILS_MAX_BYTES : file.size >= IMAGE_MAX_BYTES) {
      return fail(413, "El archivo es demasiado grande.");
    }

    let hashes: unknown;
    try {
      hashes = JSON.parse(String(form.get("hashes")));
    } catch {
      return fail(400, "La lista de archivos no es válida.");
    }
    if (!Array.isArray(hashes) || !hashes.every(hash => typeof hash === "string")) {
      return fail(400, "La lista de archivos no es válida.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    // never trust a hash sent by the browser: it is calculated here
    const hash = await sha256Hex(bytes);
    if (!hashes.includes(hash)) return fail(400, "Este archivo no es uno de los que se autorizaron.");

    // who is uploading, and are they allowed to
    const chain = scaffoldConfig.targetNetworks[0];
    const factoryAddress = (deployedContracts as unknown as Record<number, { AgoraDaoFactory?: { address: Address } }>)[
      chain.id
    ]?.AgoraDaoFactory?.address;
    if (factoryAddress === undefined) return fail(500, "El servidor no conoce el contrato de la fábrica en esta red.");

    const dao = form.get("dao");
    const authorization = await authorizeUpload(
      {
        action: KINDS[kind as Kind].action,
        address: String(form.get("address")),
        signature: String(form.get("signature")),
        timestamp: Number(form.get("timestamp")),
        hashes,
        dao: typeof dao === "string" ? dao : undefined,
      },
      createChainReader(createPublicClient({ chain, transport: http() }), factoryAddress),
    );
    if (!authorization.ok) return fail(authorization.status, authorization.message);

    // what the file really is, whatever it says it is
    let name: string;
    let contentType: string;
    if (isDetails) {
      let details: unknown;
      try {
        details = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
      } catch {
        return fail(400, "Los detalles no son un JSON válido.");
      }
      const schema = kind === "task-details" ? TaskMetadataSchema : EventMetadataSchema;
      if (!schema.safeParse(details).success) return fail(400, "Los detalles no son válidos.");

      name = `${hash}.json`;
      contentType = "application/json";
    } else {
      const type = detectImageType(bytes);
      if (type === undefined) return fail(400, "Solo se aceptan imágenes PNG o JPG.");

      name = `${hash}.${type}`;
      contentType = type === "png" ? "image/png" : "image/jpeg";
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.storage
      .from(KINDS[kind as Kind].bucket)
      .upload(name, bytes, { contentType, upsert: false });

    // the same content was uploaded before: it is already there under the same name
    const alreadyExists =
      error !== null &&
      (/already exists|duplicate/i.test(error.message) || ("statusCode" in error && error.statusCode === "409"));
    if (error !== null && !alreadyExists) {
      console.error("Supabase upload failed:", error.message);
      return fail(502, "No se pudo guardar el archivo. Inténtalo de nuevo.");
    }

    return NextResponse.json({ name });
  } catch (err) {
    console.error(err);
    return fail(500, "Ocurrió un error al subir el archivo.");
  }
};
