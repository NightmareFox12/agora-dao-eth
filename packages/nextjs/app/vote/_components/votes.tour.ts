import type { DriveStep } from "driver.js";

export const VOTES_TOUR_ID = "votes";

export const votesTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Votaciones: las decisiones de la DAO",
      description:
        "Cada propuesta tiene un plazo. Mientras está abierta, cada miembro vota una vez: a favor, en contra o abstención. El voto queda registrado y no se puede cambiar.",
    },
  },
  {
    element: '[data-tour="votes-tabs"]',
    popover: {
      title: "Abiertas y cerradas",
      description: "«En votación» son las que esperan tu voto. En «Cerradas» ves qué se aprobó y qué no.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="proposal-card"]',
    popover: {
      title: "Cómo va",
      description:
        "La barra muestra el reparto de votos y cuántos miembros han participado. Una propuesta necesita que vote al menos el 20 % de los miembros para contar.",
      side: "top",
    },
  },
  {
    element: '[data-tour="votes-new"]',
    popover: {
      title: "Publicar una propuesta",
      description:
        "Solo los gestores de propuestas y el administrador. Puede ser un texto para decidir algo, o un pago desde la tesorería a una wallet concreta.",
      side: "bottom",
    },
  },
];
