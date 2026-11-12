import type { DriveStep } from "driver.js";

export const CONFIGURATION_TOUR_ID = "configuration";

export const configurationTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Roles: tu trabajo como administrador",
      description:
        "Una DAO recién creada solo te tiene a ti. Para que funcione, nombra a quien publicará tareas, a quien llevará propuestas a votación y a quien resolverá disputas.",
    },
  },
  {
    element: '[data-tour="role-card"]',
    popover: {
      title: "Cada rol, con lo que permite",
      description:
        "La lista de permisos es exactamente lo que el contrato deja hacer a ese rol. Una persona puede tener varios.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="role-card"] button',
    popover: {
      title: "Gestionar",
      description:
        "Abre la lista de personas con el rol. Desde ahí añades wallets (varias en una sola transacción) o quitas el rol a alguien. No puedes quitártelo a ti mismo.",
      side: "left",
    },
  },
  {
    element: '[data-tour="role-changes"]',
    popover: {
      title: "Historial",
      description: "Los últimos roles asignados y quién los asignó. Todo queda en la blockchain.",
      side: "bottom",
    },
  },
];
