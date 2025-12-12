import { type NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "magenta-cheerful-ferret-114.mypinata.cloud",
});

export const POST = async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const logo = formData.get("logo") as Blob;

    if (!logo || !name) return NextResponse.json({ response: "No se proporciono un archivo" }, { status: 400 });

    const fileName = `${name}-${Date.now()}`;
    const newFile = new File([logo], fileName);
    const upload = await pinata.upload.public.file(newFile);

    return NextResponse.json({ response: "Imagen subida exitosamente!", cid: upload.cid });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { response: "Ocurrió un error al subir la imagen. Verifica tu conexión a internet" },
      { status: 500 },
    );
  }
};
