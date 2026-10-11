import { detectImageType, sha256Hex } from "~~/lib/files";
import { type UploadAction, buildUploadMessage } from "~~/lib/uploadAuth";

export type UploadKind = "logo" | "task-image" | "task-details";

/** What the server needs to know that the wallet authorized the upload. */
export type UploadAuthorization = {
  address: string;
  signature: string;
  timestamp: number;
  /** Hashes of every file the signature covers */
  hashes: string[];
  dao?: string;
};

/** Reads an image, checks it really is a PNG or JPG, and works out its hash and the name it will have. */
export const prepareImage = async (file: File) => {
  const bytes = new Uint8Array(await file.arrayBuffer());

  const type = detectImageType(bytes);
  if (type === undefined) throw new Error(`${file.name}: solo se permiten imágenes PNG o JPG.`);

  const hash = await sha256Hex(bytes);
  return { bytes, hash, name: `${hash}.${type}` };
};

/**
 * One signature covers all the files of an action (a task has up to 3 images and its details), so the user
 * only signs once.
 */
export const authorizeUploads = async (params: {
  action: UploadAction;
  hashes: string[];
  dao?: string;
  address: string;
  chainId: number;
  signMessage: (message: string) => Promise<string>;
}): Promise<UploadAuthorization> => {
  const { action, hashes, dao, address, chainId, signMessage } = params;
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = await signMessage(buildUploadMessage({ action, hashes, dao, chainId, timestamp }));
  return { address, signature, timestamp, hashes, dao };
};

/** Sends a file to the server, which saves it if the authorization is valid. Returns the name it was saved with. */
export const uploadFile = async (
  kind: UploadKind,
  bytes: Uint8Array,
  authorization: UploadAuthorization,
): Promise<string> => {
  const formData = new FormData();
  formData.append("kind", kind);
  formData.append("file", new Blob([bytes as BlobPart]), "file");
  formData.append("address", authorization.address);
  formData.append("signature", authorization.signature);
  formData.append("timestamp", String(authorization.timestamp));
  formData.append("hashes", JSON.stringify(authorization.hashes));
  if (authorization.dao !== undefined) formData.append("dao", authorization.dao);

  const response = await fetch("/api/upload", { method: "POST", body: formData });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(json.message ?? "No se pudo subir el archivo.");
  return json.name;
};
