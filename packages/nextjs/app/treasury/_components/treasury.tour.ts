import type { DriveStep } from "driver.js";

export const TREASURY_TOUR_ID = "treasury";

export const treasuryTourSteps: DriveStep[] = [
  {
    element: '[data-tour="treasury-stats"]',
    popover: {
      title: "El fondo común",
      description:
        "Cuánto hay ahora, cuántas wallets han donado, cuánto entró y cuánto salió. Son lecturas directas del contrato.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="treasury-donate"]',
    popover: {
      title: "Cualquiera puede donar",
      description:
        "Escribe una cantidad y confirma en tu wallet. Lo que entra aquí no lo controla ninguna persona: solo sale con una votación.",
      side: "right",
    },
  },
  {
    element: '[data-tour="treasury-movements"]',
    popover: {
      title: "Cada movimiento, público",
      description:
        "Quién donó y a quién se pagó, con la propuesta que lo aprobó. «Ver todos» abre el historial completo.",
      side: "left",
    },
  },
  {
    element: '[data-tour="treasury-propose"]',
    popover: {
      title: "Para sacar dinero",
      description:
        "Un gestor de propuestas publica un pago con destinatario y monto. Si los miembros lo aprueban, cualquiera puede ejecutarlo y el contrato envía el ETH.",
      side: "bottom",
    },
  },
];
