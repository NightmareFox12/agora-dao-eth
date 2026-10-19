"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EventCard } from "./EventCard";
import { CalendarDays, Plus, Search } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useEventsAddress } from "~~/hooks/useEventsAddress";
import { type EventData, type EventPhase, getEventPhase } from "~~/lib/events";

export const EventsSection: React.FC = () => {
  const eventsAddress = useEventsAddress();
  const { isMember, isAdmin } = useDaoRoles();
  const canCreateEvents = isMember || isAdmin;

  //states
  const [search, setSearch] = useState<string>("");
  const [tab, setTab] = useState<"all" | EventPhase>("upcoming");

  //smart contract
  const { data: events, isLoading } = useScaffoldReadContract({
    contractName: "AgoraEvents",
    functionName: "getAllEvents",
    contractAddress: eventsAddress,
    query: { enabled: eventsAddress !== undefined },
  });

  //memos
  const eventsFiltered = useMemo(() => {
    const text = search.trim().toLowerCase();

    return (
      [...((events ?? []) as readonly EventData[])]
        // upcoming first (soonest), past and cancelled by newest id
        .sort((a, b) => {
          const aUpcoming = getEventPhase(a) === "upcoming";
          const bUpcoming = getEventPhase(b) === "upcoming";
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;
          if (aUpcoming) return Number(a.startsAt - b.startsAt);
          return Number(b.id - a.id);
        })
        .filter(event => tab === "all" || getEventPhase(event) === tab)
        .filter(
          event =>
            text.length === 0 ||
            event.title.toLowerCase().includes(text) ||
            event.summary.toLowerCase().includes(text) ||
            event.location.toLowerCase().includes(text),
        )
    );
  }, [events, search, tab]);

  const hasEvents = (events?.length ?? 0) > 0;

  return (
    <main className="container mx-auto space-y-6 px-4 py-2">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos de la DAO</h1>
          <p className="text-muted-foreground">Encuentros, charlas y actividades abiertos a los miembros.</p>
        </div>
        {canCreateEvents ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/events/new">
              <Plus className="h-4 w-4" /> Nuevo evento
            </Link>
          </Button>
        ) : (
          <p className="m-0 max-w-xs text-xs text-muted-foreground md:text-right">
            Únete a la DAO para publicar eventos.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={value => setTab(value as typeof tab)} className="w-full lg:w-auto">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Pasados</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados</TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {eventsAddress === undefined || isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(x => (
            <Skeleton key={x} className="h-80" />
          ))}
        </div>
      ) : eventsFiltered.length === 0 ? (
        <article className="flex flex-col items-center gap-3 py-16 text-center">
          <CalendarDays className="h-16 w-16 text-muted-foreground" />
          <h3 className="m-0 text-xl font-semibold">{hasEvents ? "Ningún evento coincide" : "Aún no hay eventos"}</h3>
          <p className="m-0 max-w-sm text-muted-foreground">
            {hasEvents
              ? "Prueba con otra búsqueda o cambia la pestaña."
              : canCreateEvents
                ? "Publica el primer evento de tu DAO."
                : "Cuando un miembro publique uno, aparecerá aquí."}
          </p>
          {!hasEvents && canCreateEvents && (
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4" /> Nuevo evento
              </Link>
            </Button>
          )}
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventsFiltered.map(event => (
            <EventCard key={event.id.toString()} event={event} href={`/events/${event.id}`} />
          ))}
        </div>
      )}
    </main>
  );
};
