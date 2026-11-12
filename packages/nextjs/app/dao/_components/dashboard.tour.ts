import type { DriveStep } from "driver.js";

// Selectors point at the data-tour attributes of the header and the dashboard.
export const DASHBOARD_TOUR_ID = "dashboard";

export const dashboardTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Bienvenido a tu DAO",
      description:
        "Una DAO es un grupo que se organiza con reglas guardadas en la blockchain: quién hace qué, qué se vota y cómo se usa el dinero común. En un minuto te enseñamos lo básico.",
    },
  },
  {
    element: '[data-tour="dao-hero"]',
    popover: {
      title: "Esta es tu DAO",
      description: "Su nombre, de qué va y quién la creó. El creador es el administrador.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="my-role"]',
    popover: {
      title: "Tu rol",
      description:
        "Define lo que puedes hacer. Todos empiezan como Miembro: puedes tomar tareas, votar y apuntarte a eventos. El administrador puede darte otros roles.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="now"]',
    popover: {
      title: "Qué hay abierto",
      description:
        "Tareas que puedes tomar, propuestas que esperan tu voto, cuánto hay en la tesorería y el próximo evento. Toca una fila para ir allí.",
      side: "right",
    },
  },
  {
    element: '[data-tour="nav-tareas"]',
    popover: {
      title: "Tareas",
      description:
        "El camino más directo para contribuir y cobrar: tomas una tarea abierta, entregas y, cuando el creador aprueba, la recompensa llega a tu wallet.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-votaciones"]',
    popover: {
      title: "Votaciones",
      description: "Las decisiones de la DAO. Cada miembro vota una vez y el resultado queda público.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-tesoreria"]',
    popover: {
      title: "Tesorería",
      description: "El fondo común. Solo sale dinero cuando una propuesta de pago se aprueba.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-perfil"]',
    popover: {
      title: "Tu perfil",
      description: "Tus tareas, tus puntos, tu nivel y las insignias que ganes.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="activity"]',
    popover: {
      title: "Actividad reciente",
      description: "Quién se une y qué roles se asignan. Todo queda registrado en la blockchain.",
      side: "top",
    },
  },
  {
    element: '[data-tour="tour-button"]',
    popover: {
      title: "Cada pantalla tiene su guía",
      description:
        "Verás este botón en cada sección. La guía se abre sola la primera vez; después puedes repetirla cuando quieras. Siguiente paso: entra en Tareas.",
      side: "left",
    },
  },
];
