import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";
import { TaskMetadataSchema } from "~~/lib/schemes/task.scheme";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY!,
});

/** Stores the details of a task (description, images, criteria, links) on IPFS and returns its CID. */
export const POST = async (request: NextRequest) => {
  try {
    const metadata = TaskMetadataSchema.safeParse(await request.json());

    if (!metadata.success) {
      return NextResponse.json({ response: "Los detalles de la tarea no son válidos." }, { status: 400 });
    }

    const upload = await pinata.upload.public.json(metadata.data);

    return NextResponse.json({ response: "¡Detalles guardados exitosamente!", cid: upload.cid });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { response: "Ocurrió un error al guardar los detalles. Verifica tu conexión a internet" },
      { status: 500 },
    );
  }
};
