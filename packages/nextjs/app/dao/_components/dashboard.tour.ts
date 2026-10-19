import type { DriveStep } from "driver.js";

// Selectors point at the data-tour attributes of the header and the dashboard.
export const DASHBOARD_TOUR_ID = "dashboard";

export const dashboardTourSteps: DriveStep[] = [
  {
    popover: {
      title: "¡Bienvenido a tu DAO!",
      description:
        "Una DAO es una organización que gestionan sus propios miembros, con reglas y fondos guardados en la blockchain. Te enseñamos lo básico en un minuto.",
    },
  },
  {
    element: '[data-tour="dao-hero"]',
    popover: {
      title: "Esta es tu DAO",
      description: "Aquí ves su nombre, sus categorías y quién la creó.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="my-role"]',
    popover: {
      title: "Tu rol",
      description:
        "Define lo que puedes hacer. Todos empiezan como Miembro, y el administrador puede darte otros roles, como Auditor o Gestor de tareas.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-tareas"]',
    popover: {
      title: "Tareas",
      description: "Trabajos que la DAO publica con recompensa. Podrás tomarlos y cobrar cuando se completen.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-votaciones"]',
    popover: {
      title: "Votaciones",
      description: "Propuestas que la DAO vota. Cada miembro vota una vez, y el resultado queda público.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-tesoreria"]',
    popover: {
      title: "Tesorería",
      description: "Los fondos de la DAO. Solo salen cuando una propuesta aprobada por los miembros los libera.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-perfil"]',
    popover: {
      title: "Tu perfil",
      description: "Tu actividad, tu nivel y las insignias NFT que ganes por contribuir irán aquí.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="nav-configuracion"]',
    popover: {
      title: "Configuración",
      description: "Desde aquí el administrador asigna y quita roles a los miembros.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="activity"]',
    popover: {
      title: "Actividad reciente",
      description: "Quién se une y qué roles se asignan. Todo queda registrado en la blockchain y es público.",
      side: "top",
    },
  },
  {
    element: '[data-tour="modules"]',
    popover: {
      title: "Módulos",
      description:
        "Las herramientas que irá habilitando la DAO: tareas, votaciones, tesorería y más. Los marcados como «Próximamente» están en desarrollo.",
      side: "left",
    },
  },
  {
    popover: {
      title: "¡Listo!",
      description: "Puedes repetir esta guía cuando quieras con el botón «Ver guía» de esta pantalla.",
    },
  },
];
