import type { DriveStep } from "driver.js";

export const PROPOSAL_DETAIL_TOUR_ID = "proposal-detail";

export const proposalDetailTourSteps: DriveStep[] = [
  {
    element: '[data-tour="proposal-results"]',
    popover: {
      title: "Resultados en vivo",
      description:
        "Votos a favor, en contra y abstenciones, y si ya se llegó al quorum (el 20 % de los miembros). Sin quorum, la propuesta no cuenta aunque gane el sí.",
      side: "left",
    },
  },
  {
    element: '[data-tour="proposal-actions"]',
    popover: {
      title: "Tu voto",
      description:
        "Si la votación está abierta y eres miembro, aquí eliges. Cuando el plazo termina, cualquiera puede cerrarla para publicar el resultado; si era un pago aprobado, cualquiera puede ejecutarlo.",
      side: "left",
    },
  },
];
