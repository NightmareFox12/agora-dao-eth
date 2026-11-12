import { CircleQuestionMark } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";

/** Replays the guided tour of the current page. Same look everywhere, so people learn to find it. */
export const TourButton: React.FC<{ onClick: () => void; className?: string }> = ({ onClick, className }) => (
  <Button variant="outline" size="sm" onClick={onClick} className={className} data-tour="tour-button">
    <CircleQuestionMark className="size-4" />
    Guía
  </Button>
);
