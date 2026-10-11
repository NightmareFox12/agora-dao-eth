import { keccak256, toHex } from "viem";

export const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
export const AUDITOR_ROLE = keccak256(toHex("AUDITOR_ROLE"));
export const TASK_MANAGER_ROLE = keccak256(toHex("TASK_MANAGER_ROLE"));
export const PROPOSAL_MANAGER_ROLE = keccak256(toHex("PROPOSAL_MANAGER_ROLE"));
export const USER_ROLE = keccak256(toHex("USER_ROLE"));

// Ordered by importance: the first one the user has is shown as their main role.
export const ROLE_LABELS = [
  { role: DEFAULT_ADMIN_ROLE, label: "Administrador" },
  { role: AUDITOR_ROLE, label: "Auditor" },
  { role: TASK_MANAGER_ROLE, label: "Gestor de tareas" },
  { role: PROPOSAL_MANAGER_ROLE, label: "Gestor de propuestas" },
  { role: USER_ROLE, label: "Miembro" },
] as const;

export const getRoleLabel = (role: string) => ROLE_LABELS.find(x => x.role === role.toLowerCase())?.label ?? "Rol";
