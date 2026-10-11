import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 30, unit: "day" },
  { amount: 12, unit: "month" },
  { amount: Number.POSITIVE_INFINITY, unit: "year" },
];

/** "hace 3 horas", "ayer"... from a unix timestamp in seconds. */
export const formatRelativeTime = (timestampInSeconds: number) => {
  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  let duration = timestampInSeconds - Date.now() / 1000;

  for (const { amount, unit } of DIVISIONS) {
    if (Math.abs(duration) < amount) return formatter.format(Math.round(duration), unit);
    duration /= amount;
  }
};

/** Timestamp (seconds) of an event read with `blockData: true`, or 0 when it is not available. */
export const getEventTimestamp = (event: unknown) =>
  Number((event as { blockData?: { timestamp: bigint } | null }).blockData?.timestamp ?? 0n);
