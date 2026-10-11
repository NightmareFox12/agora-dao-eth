// The text a user signs with their wallet to authorize an upload. The browser and the server build it from the
// same data, so it is never sent: the server rebuilds it and checks the signature against it.

export type UploadAction = "logo" | "task";

/** How old a signature can be (in seconds) before the server stops accepting it */
export const UPLOAD_MESSAGE_MAX_AGE_SECONDS = 10 * 60;

export const MAX_FILES_PER_UPLOAD = 8;

type UploadMessageData = {
  action: UploadAction;
  /** SHA-256 of every file the signature authorizes */
  hashes: string[];
  /** DAO the task belongs to (only for tasks) */
  dao?: string;
  chainId: number;
  /** Unix time in seconds */
  timestamp: number;
};

const ACTION_LABELS: Record<UploadAction, string> = {
  logo: "subir el logo de una DAO",
  task: "subir los archivos de una tarea",
};

export const buildUploadMessage = ({ action, hashes, dao, chainId, timestamp }: UploadMessageData) =>
  [
    "Agora DAO",
    "",
    `Autorizo: ${ACTION_LABELS[action]}.`,
    dao === undefined ? undefined : `DAO: ${dao.toLowerCase()}`,
    `Red: ${chainId}`,
    `Fecha: ${timestamp}`,
    "",
    "Archivos (SHA-256):",
    ...[...hashes].sort().map(hash => `- ${hash}`),
  ]
    .filter(line => line !== undefined)
    .join("\n");
