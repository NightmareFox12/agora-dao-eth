import { cn } from "~~/lib/utils";

/** Horizontal bar with the For, Against and Abstain shares side by side. */
export const VoteBar: React.FC<{ forPercent: number; againstPercent: number; abstainPercent: number }> = ({
  forPercent,
  againstPercent,
  abstainPercent,
}) => {
  const segments = [
    { percent: forPercent, color: "bg-emerald-500 dark:bg-emerald-600" },
    { percent: againstPercent, color: "bg-rose-500 dark:bg-rose-600" },
    { percent: abstainPercent, color: "bg-slate-400 dark:bg-slate-500" },
  ];

  const total = segments.reduce((sum, segment) => sum + segment.percent, 0);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      {total > 0 && (
        <div className="flex h-full">
          {segments.map(({ percent, color }, index) => (
            <div key={index} style={{ width: `${percent}%` }} className={cn("h-full", color)} />
          ))}
        </div>
      )}
    </div>
  );
};
