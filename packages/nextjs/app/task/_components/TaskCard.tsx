import Link from "next/link";
import { Ban, CircleCheck, Clock, Coins, Timer, UserRound } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardFooter, CardHeader } from "~~/components/ui/shadcn/card";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { TASK_STATUS, TASK_STATUS_META, getDeadlineText } from "~~/lib/tasks";
import { cn, shortAddress } from "~~/lib/utils";

type TaskCardProps = {
  title: string;
  summary: string;
  categoryId: number;
  /** In wei */
  reward: bigint;
  status: number;
  deadline?: bigint;
  /** Days the assignee has to deliver once they take it */
  workDays?: number;
  creator?: string;
  /** Makes the whole card a link (the preview in the publish form is not one) */
  href?: string;
};

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  summary,
  categoryId,
  reward,
  status,
  deadline = 0n,
  workDays,
  creator,
  href,
}) => {
  const statusMeta = TASK_STATUS_META[status];
  const deadlineText = getDeadlineText(status, deadline);
  const category = TASK_CATEGORIES[categoryId];

  const isCancelled = status === TASK_STATUS.Cancelled;
  const isCompleted = status === TASK_STATUS.Completed;
  // the delivery window only matters while somebody can still work on the task
  const showWorkDays = workDays !== undefined && !isCancelled && !isCompleted;

  const card = (
    <Card className={cn("transition-shadow hover:shadow-md", isCancelled && "opacity-70")}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {category !== undefined ? (
            <Badge variant="outline" className={getCategoryStyle(categoryId).soft}>
              {category.toLowerCase()}
            </Badge>
          ) : (
            <span />
          )}
          <Badge className={cn("border-transparent", statusMeta?.className)}>{statusMeta?.label}</Badge>
        </div>
        <h3 className="m-0 font-semibold leading-snug tracking-tight break-words">{title}</h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="m-0 text-sm text-muted-foreground line-clamp-3 break-words">{summary}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <div
            className={cn(
              "flex items-center gap-1 font-medium text-primary",
              isCancelled && "text-muted-foreground line-through",
            )}
          >
            <Coins className="h-4 w-4" />
            {formatEther(reward)} ETH
          </div>
          {showWorkDays && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Timer className="h-4 w-4" />
              {workDays} días para entregar
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t pt-4 text-xs text-muted-foreground">
        {creator !== undefined && (
          <span className="flex items-center gap-1">
            <UserRound className="h-3.5 w-3.5" />
            {shortAddress(creator)}
          </span>
        )}
        {isCancelled && (
          <span className="flex items-center gap-1">
            <Ban className="h-3.5 w-3.5" />
            Recompensa devuelta
          </span>
        )}
        {isCompleted && (
          <span className="flex items-center gap-1">
            <CircleCheck className="h-3.5 w-3.5" />
            Recompensa pagada
          </span>
        )}
        {deadlineText !== undefined && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {deadlineText}
          </span>
        )}
      </CardFooter>
    </Card>
  );

  if (href === undefined) return card;

  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {card}
    </Link>
  );
};
