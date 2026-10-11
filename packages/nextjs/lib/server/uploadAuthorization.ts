// Server only. Decides whether an upload is allowed, from a wallet signature and what the blockchain says.
import { type Address, type Hex, type PublicClient, isAddress, parseAbi } from "viem";
import { DEFAULT_ADMIN_ROLE, TASK_MANAGER_ROLE } from "~~/constants/roles";
import { isSha256Hex } from "~~/lib/files";
import {
  MAX_FILES_PER_UPLOAD,
  UPLOAD_MESSAGE_MAX_AGE_SECONDS,
  type UploadAction,
  buildUploadMessage,
} from "~~/lib/uploadAuth";

/** What the authorization needs from the blockchain. Tests replace it with a fake. */
export type ChainReader = {
  chainId: number;
  verifyMessage: (args: { address: Address; message: string; signature: Hex }) => Promise<boolean>;
  /** Is this address a DAO created by our factory? */
  isDao: (dao: Address) => Promise<boolean>;
  hasRole: (dao: Address, role: Hex, user: Address) => Promise<boolean>;
};

const factoryAbi = parseAbi(["function isDao(address) view returns (bool)"]);
const daoAbi = parseAbi(["function isRole(bytes32 role, address user) view returns (bool)"]);

export const createChainReader = (client: PublicClient, factoryAddress: Address): ChainReader => ({
  chainId: client.chain?.id ?? 0,
  // goes through the blockchain client so smart-contract wallets (ERC-1271) work too
  verifyMessage: args => client.verifyMessage(args),
  isDao: dao => client.readContract({ address: factoryAddress, abi: factoryAbi, functionName: "isDao", args: [dao] }),
  hasRole: (dao, role, user) =>
    client.readContract({ address: dao, abi: daoAbi, functionName: "isRole", args: [role, user] }),
});

export type UploadAuthorizationRequest = {
  action: UploadAction;
  address: string;
  signature: string;
  /** Unix time in seconds, as written in the signed message */
  timestamp: number;
  hashes: string[];
  dao?: string;
};

export type AuthorizationResult = { ok: true } | { ok: false; status: number; message: string };

const deny = (status: number, message: string): AuthorizationResult => ({ ok: false, status, message });

/**
 * - Logos: any wallet that signs. The DAO does not exist yet, so there is nobody to check against.
 * - Tasks: the signer must be a task manager or an admin of a DAO created by our factory.
 */
export const authorizeUpload = async (
  request: UploadAuthorizationRequest,
  reader: ChainReader,
  nowInSeconds: number = Math.floor(Date.now() / 1000),
): Promise<AuthorizationResult> => {
  const { action, address, signature, timestamp, hashes, dao } = request;

  if (!isAddress(address)) return deny(400, "La dirección de la wallet no es válida.");
  if (!/^0x[0-9a-fA-F]+$/.test(signature)) return deny(400, "La firma no es válida.");
  if (!Number.isInteger(timestamp)) return deny(400, "La fecha de la firma no es válida.");
  if (Math.abs(nowInSeconds - timestamp) > UPLOAD_MESSAGE_MAX_AGE_SECONDS) {
    return deny(401, "La firma caducó. Vuelve a intentarlo.");
  }
  if (hashes.length === 0 || hashes.length > MAX_FILES_PER_UPLOAD || !hashes.every(isSha256Hex)) {
    return deny(400, "La lista de archivos no es válida.");
  }
  if (action === "task" && (dao === undefined || !isAddress(dao))) return deny(400, "Falta la DAO de la tarea.");

  const message = buildUploadMessage({ action, hashes, dao, chainId: reader.chainId, timestamp });
  const isSigned = await reader.verifyMessage({ address, message, signature: signature as Hex }).catch(() => false);
  if (!isSigned) return deny(401, "La firma no corresponde a esta wallet.");

  if (action === "task") {
    const daoAddress = dao as Address;

    if (!(await reader.isDao(daoAddress))) return deny(403, "Esa dirección no es una DAO de Agora.");

    const [isManager, isAdmin] = await Promise.all([
      reader.hasRole(daoAddress, TASK_MANAGER_ROLE, address),
      reader.hasRole(daoAddress, DEFAULT_ADMIN_ROLE, address),
    ]);
    if (!isManager && !isAdmin)
      return deny(403, "Solo los gestores de tareas y los administradores pueden subir archivos.");
  }

  return { ok: true };
};
