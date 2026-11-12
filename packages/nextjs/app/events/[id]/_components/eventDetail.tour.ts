import type { DriveStep } from "driver.js";

export const EVENT_DETAIL_TOUR_ID = "event-detail";

export const eventDetailTourSteps: DriveStep[] = [
  {
    element: '[data-tour="event-info"]',
    popover: {
      title: "Lo esencial",
      description: "Cuándo, dónde y cuántas plazas quedan. Si el aforo se llena, ya no se puede apuntar nadie más.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="event-attendees"]',
    popover: {
      title: "Quién va",
      description: "La lista es pública y vive en la blockchain: cada wallet que se apuntó.",
      side: "top",
    },
  },
  {
    element: '[data-tour="event-actions"]',
    popover: {
      title: "Apúntate",
      description:
        "Una transacción y quedas en la lista. Puedes borrarte mientras el evento no haya empezado. Quien lo publicó puede cancelarlo.",
      side: "left",
    },
  },
];
