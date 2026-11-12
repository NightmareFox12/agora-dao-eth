import type { DriveStep } from "driver.js";

export const PROFILE_TOUR_ID = "profile";

export const profileTourSteps: DriveStep[] = [
  {
    element: '[data-tour="profile-identity"]',
    popover: {
      title: "Tu wallet es tu identidad",
      description: "No hay usuario ni contraseña. Aquí ves tus roles en esta DAO y desde cuándo eres miembro.",
      side: "right",
    },
  },
  {
    element: '[data-tour="profile-reputation"]',
    popover: {
      title: "Puntos, nivel e insignias",
      description:
        "Cada aporte suma puntos: 50 por completar una tarea, 10 por publicar un evento, 5 por votar o apuntarte. Al cambiar de nivel recibes una insignia NFT que nadie puede quitarte.",
      side: "left",
    },
  },
  {
    element: '[data-tour="profile-tasks"]',
    popover: {
      title: "Tus tareas",
      description: "Las que publicaste y las que tienes a tu cargo, con su estado. Desde aquí vuelves a cada una.",
      side: "top",
    },
  },
  {
    element: '[data-tour="profile-reset-tours"]',
    popover: {
      title: "¿Quieres ver las guías otra vez?",
      description: "Este botón vuelve a activar la guía de cada pantalla, como si fuera tu primera vez.",
      side: "top",
    },
  },
];
