// Same order as the Status enum in AgoraEvents.sol
export const EVENT_STATUS = { Scheduled: 0, Cancelled: 1 } as const;

/**
 * How an event is doing right now. `Past` is computed from the date; the contract does not store it, so a
 * cancelled event that is in the past still shows as cancelled (keeps the reason it ended).
 */
export const EVENT_PHASE = { Upcoming: "upcoming", Past: "past", Cancelled: "cancelled" } as const;
export type EventPhase = (typeof EVENT_PHASE)[keyof typeof EVENT_PHASE];

export const EVENT_PHASE_META: Record<EventPhase, { label: string; className: string }> = {
  upcoming: {
    label: "Próximamente",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  past: {
    label: "Pasado",
    className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
};

/** An event as AgoraEvents.getEventById returns it */
export type EventData = {
  id: bigint;
  creator: string;
  title: string;
  summary: string;
  /** Unix timestamp (seconds) when the event starts */
  startsAt: bigint;
  location: string;
  /** 0 = no limit */
  maxAttendees: bigint;
  /** SHA-256 of the details file (0x00 = no extended details) */
  metadataHash: string;
  status: number;
  createdAt: bigint;
};

const EMPTY_HASH = "0x0000000000000000000000000000000000000000000000000000000000000000";

export const hasMetadata = (hash: string) => hash !== EMPTY_HASH;

/** Current phase of an event, derived from its status and date. */
export const getEventPhase = (event: EventData): EventPhase => {
  if (event.status === EVENT_STATUS.Cancelled) return "cancelled";
  return Number(event.startsAt) * 1000 < Date.now() ? "past" : "upcoming";
};

/** "El sábado 15 de noviembre a las 19:30" (Spanish). */
export const formatEventDate = (startsAt: bigint) => {
  const date = new Date(Number(startsAt) * 1000);
  return new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
