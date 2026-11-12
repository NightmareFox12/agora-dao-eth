import type { DriveStep } from "driver.js";

export const TASK_DETAIL_TOUR_ID = "task-detail";

export const taskDetailTourSteps: DriveStep[] = [
  {
    element: '[data-tour="task-reward"]',
    popover: {
      title: "La recompensa ya está depositada",
      description:
        "Este ETH está en el contrato, no en la wallet de nadie. Solo sale hacia quien entregue el trabajo aprobado, o vuelve al creador si la tarea se cancela.",
      side: "left",
    },
  },
  {
    element: '[data-tour="task-progress"]',
    popover: {
      title: "Los cuatro pasos",
      description:
        "Publicada → Tomada → Entregada → Pagada. Si el creador pide cambios, vuelves a entregar. Si no se ponen de acuerdo, un auditor decide.",
      side: "left",
    },
  },
  {
    element: '[data-tour="task-people"]',
    popover: {
      title: "Quién publicó y quién la tiene",
      description: "El creador es quien aprueba la entrega. Si nadie la tiene todavía, puedes ser tú.",
      side: "left",
    },
  },
  {
    element: '[data-tour="task-actions"]',
    popover: {
      title: "Qué puedes hacer",
      description:
        "Aquí aparece solo lo que te corresponde según tu papel y el estado: tomarla, entregar un enlace, aprobar, pedir cambios o reclamar el pago. Cada acción es una transacción que confirmas en tu wallet.",
      side: "left",
    },
  },
];
