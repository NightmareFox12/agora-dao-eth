import { Clock, Coins } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardFooter, CardHeader } from "~~/components/ui/shadcn/card";
import { cn } from "~~/lib/utils";

interface TaskProps {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: "open" | "in-progress" | "completed";
  category: string;
  priority: "low" | "medium" | "high";
  deadline: string;
}

const statusColors = {
  open: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const priorityColors = {
  low: "text-blue-500",
  medium: "text-yellow-500",
  high: "text-red-500",
};

export const TaskCard: React.FC<TaskProps> = ({ title, description, reward, status, category, priority, deadline }) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <Badge variant="secondary" className="mb-2 font-normal">
            {category}
          </Badge>
          <h3 className="font-semibold leading-none tracking-tight">{title}</h3>
        </div>
        <Badge className={statusColors[status]}>{status.replace("-", " ")}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{description}</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-primary font-medium">
            <Coins className="h-4 w-4" />
            {reward}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            {deadline}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex items-center text-xs text-muted-foreground">
          <span className={cn("mr-1 font-bold", priorityColors[priority])}>•</span>
          Prioridad {priority}
        </div>
        <Button size="sm">Ver Detalles</Button>
      </CardFooter>
    </Card>
  );
};
