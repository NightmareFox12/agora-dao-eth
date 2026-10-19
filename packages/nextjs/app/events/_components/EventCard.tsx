import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardHeader } from "~~/components/ui/shadcn/card";
import { EVENT_PHASE_META, type EventData, formatEventDate, getEventPhase } from "~~/lib/events";
import { getEventCoverUrl } from "~~/lib/storage";
import { cn } from "~~/lib/utils";

type EventCardProps = {
  event: EventData;
  attendeeCount?: bigint;
  /** File name of the cover (from the event's details file) */
  coverName?: string;
  href?: string;
};

export const EventCard: React.FC<EventCardProps> = ({ event, attendeeCount, coverName, href }) => {
  const phase = getEventPhase(event);
  const phaseMeta = EVENT_PHASE_META[phase];

  const card = (
    <Card
      className={cn("overflow-hidden pt-0 transition-shadow hover:shadow-md", phase !== "upcoming" && "opacity-70")}
    >
      {coverName !== undefined ? (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getEventCoverUrl(coverName)} alt="" className="size-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
      )}

      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Badge className={cn("border-transparent", phaseMeta.className)}>{phaseMeta.label}</Badge>
          {attendeeCount !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {attendeeCount.toString()}
              {event.maxAttendees > 0n && ` / ${event.maxAttendees.toString()}`}
            </span>
          )}
        </div>
        <h3 className="m-0 font-semibold leading-snug tracking-tight [overflow-wrap:anywhere]">{event.title}</h3>
      </CardHeader>

      <CardContent className="space-y-2">
        <p className="m-0 line-clamp-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">{event.summary}</p>
        <div className="flex flex-col gap-1 text-sm">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {formatEventDate(event.startsAt)}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{event.location}</span>
          </span>
        </div>
      </CardContent>
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
