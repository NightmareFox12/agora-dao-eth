import type { DriveStep } from "driver.js";

export const TASKS_TOUR_ID = "tasks";

export const tasksTourSteps: DriveStep[] = [
  {
    popover: {
      title: "Tareas: así se cobra en la DAO",
      description:
        "Una tarea es un trabajo con recompensa en ETH. El dinero se aparta al publicarla, así que si la entregas y te la aprueban, cobras seguro.",
    },
  },
  {
    element: '[data-tour="tasks-tabs"]',
    popover: {
      title: "Por estado",
      description:
        "«Abiertas» son las que puedes tomar ahora. «En curso» ya tienen a alguien trabajando. «Cerradas» se pagaron o se cancelaron.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="tasks-category"]',
    popover: {
      title: "Por tipo de trabajo",
      description: "Desarrollo, diseño, contenido… Quédate con lo que sabes hacer.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="task-card"]',
    popover: {
      title: "Lee antes de tomar",
      description:
        "La tarjeta muestra la recompensa y los días que tendrás para entregar desde que la tomes. Ábrela para ver la descripción completa y los criterios de aceptación.",
      side: "top",
    },
  },
  {
    element: '[data-tour="tasks-new"]',
    popover: {
      title: "Publicar una tarea",
      description:
        "Solo los gestores de tareas y el administrador. Al publicarla depositan la recompensa, que queda bloqueada hasta que se pague o se cancele.",
      side: "bottom",
    },
  },
];
