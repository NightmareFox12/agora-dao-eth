import type { DriveStep } from "driver.js";

export const DAOS_TOUR_ID = "daos";

export const daosTourSteps: DriveStep[] = [
  {
    element: '[data-tour="daos-title"]',
    popover: {
      title: "Primero, una DAO",
      description:
        "Todo en Agora pasa dentro de una DAO: las tareas, las votaciones y el fondo común son de cada una. Aquí eliges en cuál entrar.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="daos-search"]',
    popover: {
      title: "Busca por nombre",
      description: "Si te dijeron el nombre de la DAO, escríbelo aquí.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="daos-filters"]',
    popover: {
      title: "Filtra",
      description: "Por categoría, o solo las DAOs que creaste tú.",
      side: "bottom",
    },
  },
  {
    element: '[data-tour="dao-card"]',
    popover: {
      title: "Cada tarjeta es una DAO",
      description: "Cuántos miembros tiene, de qué va y quién la creó. «Detalles» muestra todo sin entrar.",
      side: "top",
    },
  },
  {
    element: '[data-tour="dao-join"]',
    popover: {
      title: "Unirse es una transacción",
      description:
        "Tu wallet te pedirá confirmar y pagarás solo la tarifa de la red. Desde ese momento eres miembro: puedes tomar tareas, votar y apuntarte a eventos. Si ya eres miembro, el botón dice «Entrar».",
      side: "top",
    },
  },
  {
    element: '[data-tour="daos-create"]',
    popover: {
      title: "O crea la tuya",
      description:
        "Necesitas un nombre único, una descripción y hasta tres categorías. Se crean sus seis módulos de una vez y tú quedas como administrador.",
      side: "bottom",
    },
  },
];
