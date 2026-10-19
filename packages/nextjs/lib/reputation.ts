// Order matches AgoraReputation.levelThresholds. Keep in sync with the contract.
export const LEVEL_THRESHOLDS = [100, 300, 600, 1000, 1500, 2500] as const;

export const LEVEL_META: Record<number, { label: string; color: string; textColor: string }> = {
  0: { label: "Novato", color: "bg-slate-400 dark:bg-slate-500", textColor: "text-slate-100" },
  1: { label: "Aprendiz", color: "bg-amber-700", textColor: "text-amber-50" },
  2: { label: "Colaborador", color: "bg-slate-500", textColor: "text-slate-50" },
  3: { label: "Veterano", color: "bg-yellow-500", textColor: "text-yellow-950" },
  4: { label: "Experto", color: "bg-sky-500", textColor: "text-sky-50" },
  5: { label: "Maestro", color: "bg-violet-600", textColor: "text-violet-50" },
  6: { label: "Leyenda", color: "bg-rose-600", textColor: "text-rose-50" },
};
