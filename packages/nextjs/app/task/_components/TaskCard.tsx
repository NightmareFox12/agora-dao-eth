import { Clock, Coins, Timer, UserRound } from "lucide-react";
import { formatEther } from "viem";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardFooter, CardHeader } from "~~/components/ui/shadcn/card";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { TASK_STATUS_META, getDeadlineText } from "~~/lib/tasks";
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
}) => {
  const statusMeta = TASK_STATUS_META[status];
  const deadlineText = getDeadlineText(status, deadline);
  const category = TASK_CATEGORIES[categoryId];

  return (
    <Card className="hover:shadow-md transition-shadow">
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
          <div className="flex items-center gap-1 font-medium text-primary">
            <Coins className="h-4 w-4" />
            {formatEther(reward)} ETH
          </div>
          {workDays !== undefined && (
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
        {deadlineText !== undefined && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {deadlineText}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};
