import { formatRelativeTime } from "~~/lib/utils";

// Same order as the Status enum in AgoraTasks.sol
export const TASK_STATUS = {
  Open: 0,
  Taken: 1,
  Submitted: 2,
  Rejected: 3,
  Disputed: 4,
  Completed: 5,
  Cancelled: 6,
} as const;

// Every class is written out in full so Tailwind can detect it.
export const TASK_STATUS_META: Record<number, { label: string; className: string }> = {
  [TASK_STATUS.Open]: {
    label: "Abierta",
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  [TASK_STATUS.Taken]: {
    label: "En curso",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  [TASK_STATUS.Submitted]: {
    label: "En revisión",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  [TASK_STATUS.Rejected]: {
    label: "Con cambios",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  [TASK_STATUS.Disputed]: {
    label: "En disputa",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  [TASK_STATUS.Completed]: {
    label: "Completada",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  [TASK_STATUS.Cancelled]: {
    label: "Cancelada",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  },
};

// What each deadline means depends on the status (see AgoraTasks.sol)
const DEADLINE_LABELS: Record<number, string> = {
  [TASK_STATUS.Open]: "Se cierra",
  [TASK_STATUS.Taken]: "Entrega",
  [TASK_STATUS.Submitted]: "Revisión",
  [TASK_STATUS.Rejected]: "Corrección",
};

/** "Se cierra dentro de 12 días", "Plazo vencido hace 2 días"... or undefined when the status has no deadline. */
export const getDeadlineText = (status: number, deadline: bigint) => {
  const label = DEADLINE_LABELS[status];
  if (label === undefined || deadline === 0n) return undefined;

  const seconds = Number(deadline);
  const relative = formatRelativeTime(seconds);

  return seconds * 1000 < Date.now() ? `Plazo vencido ${relative}` : `${label} ${relative}`;
};
