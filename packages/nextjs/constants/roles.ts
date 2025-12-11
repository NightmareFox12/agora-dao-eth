import { keccak256, toHex } from "viem";

export const DEFAULT_ADMIN_ROLE = keccak256(toHex("DEFAULT_ADMIN_ROLE"));
export const AUDITOR_ROLE = keccak256(toHex("AUDITOR_ROLE"));
export const TASK_MANAGER_ROLE = keccak256(toHex("TASK_MANAGER_ROLE"));
export const PROPOSAL_MANAGER_ROLE = keccak256(toHex("PROPOSAL_MANAGER_ROLE"));
export const USER_ROLE = keccak256(toHex("USER_ROLE"));
