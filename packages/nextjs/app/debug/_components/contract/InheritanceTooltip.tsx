import { Info } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/shadcn/tooltip";

export const InheritanceTooltip = ({ inheritedFrom }: { inheritedFrom?: string }) =>
  inheritedFrom && (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-default">
          <Info />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{`Inherited from: ${inheritedFrom}`}</p>
      </TooltipContent>
    </Tooltip>
  );
