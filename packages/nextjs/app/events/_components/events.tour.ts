import type { DriveStep } from "driver.js";

export const EVENTS_TOUR_ID = "events";

export const eventsTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Eventos: para verse",
      description:
        "Encuentros, charlas y actividades de la DAO. Solo los miembros los publican y solo los miembros se apuntan.",
    },
  },
  {
    element: '[data-tour="events-tabs"]',
    popover: {
      title: "Próximos y pasados",
      description: "Los próximos van primero, el más cercano arriba.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="event-card"]',
    popover: {
      title: "Fecha, lugar y aforo",
      description:
        "Ábrelo para ver la descripción completa, quién va y apuntarte. Apuntarte suma 5 puntos de reputación.",
      side: "top",
    },
  },
  {
    element: '[data-tour="events-new"]',
    popover: {
      title: "Publicar un evento",
      description:
        "Cualquier miembro puede. Pon fecha, lugar y, si hace falta, un aforo máximo. Publicar suma 10 puntos.",
      side: "bottom",
    },
  },
];
