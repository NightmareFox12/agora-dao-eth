"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  Clock,
  FileSearch,
  Image as ImageIcon,
  Loader,
  MapPin,
  RefreshCw,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Markdown } from "~~/components/Markdown";
import { Address } from "~~/components/scaffold-eth";
import { BlockieAvatar } from "~~/components/scaffold-eth/BlockieAvatar";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useEventsAddress } from "~~/hooks/useEventsAddress";
import { EVENT_PHASE_META, type EventData, formatEventDate, getEventPhase, hasMetadata } from "~~/lib/events";
import { fetchEventMetadata, getEventCoverUrl } from "~~/lib/storage";
import { cn, shortAddress } from "~~/lib/utils";

export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const eventsAddress = useEventsAddress();
  const { isMember, isAdmin } = useDaoRoles();
  const canRegister = isMember || isAdmin;

  //states
  const [pending, setPending] = useState<string>();

  const isValidId = /^\d+$/.test(id);

  //smart contract
  const {
    data: event,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "AgoraEvents",
    functionName: "getEventById",
    args: [isValidId ? BigInt(id) : undefined],
    contractAddress: eventsAddress,
    query: { enabled: eventsAddress !== undefined && isValidId },
  });

  const { data: attendees } = useScaffoldReadContract({
    contractName: "AgoraEvents",
    functionName: "getAttendees",
    args: [isValidId ? BigInt(id) : undefined],
    contractAddress: eventsAddress,
    query: { enabled: eventsAddress !== undefined && isValidId },
  });

  const { data: amAttending } = useScaffoldReadContract({
    contractName: "AgoraEvents",
    functionName: "isAttending",
    args: [isValidId ? BigInt(id) : undefined, address],
    contractAddress: eventsAddress,
    query: { enabled: eventsAddress !== undefined && isValidId && address !== undefined },
  });

  const metadataQuery = useQuery({
    queryKey: ["event-metadata", event?.metadataHash],
    queryFn: () => fetchEventMetadata(event!.metadataHash as string),
    enabled: event !== undefined && hasMetadata(event.metadataHash as string),
    staleTime: Infinity,
    retry: 1,
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgoraEvents",
    contractAddress: eventsAddress,
  });

  const perform = async (name: string, action: () => Promise<unknown>, success: string) => {
    setPending(name);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(undefined);
    }
  };

  const register = () =>
    perform("register", () => writeContractAsync({ functionName: "register", args: [BigInt(id)] }), "¡Te apuntaste!");

  const cancelRegistration = () =>
    perform(
      "cancel-registration",
      () => writeContractAsync({ functionName: "cancelRegistration", args: [BigInt(id)] }),
      "Cancelaste tu inscripción.",
    );

  const cancelEvent = () =>
    perform(
      "cancel-event",
      () => writeContractAsync({ functionName: "cancelEvent", args: [BigInt(id)] }),
      "Evento cancelado.",
    );

  const spinner = (name: string) => pending === name && <Loader className="size-4 animate-spin" />;

  if (!isValidId || (error !== null && error !== undefined)) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
        <FileSearch className="h-16 w-16 text-muted-foreground" />
        <h1 className="m-0 text-2xl font-bold">No encontramos este evento</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Puede que el enlace sea incorrecto o que el evento no exista.
        </p>
        <Button asChild>
          <Link href="/events">Volver a los eventos</Link>
        </Button>
      </main>
    );
  }

  if (isLoading || event === undefined || eventsAddress === undefined) {
    return (
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  const e = event as EventData;
  const phase = getEventPhase(e);
  const phaseMeta = EVENT_PHASE_META[phase];
  const attendeeList = (attendees ?? []) as readonly string[];
  const isCreator = address?.toLowerCase() === e.creator.toLowerCase();
  const isAlreadyRegistered = amAttending === true;
  const isFull = e.maxAttendees > 0n && BigInt(attendeeList.length) >= e.maxAttendees;
  const busy = pending !== undefined;
  const coverName = metadataQuery.data?.cover ?? undefined;

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a los eventos
      </Link>

      {/* Cover and title */}
      <div className="space-y-4">
        {coverName !== undefined ? (
          <div className="aspect-[21/9] w-full overflow-hidden rounded-xl border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getEventCoverUrl(coverName)} alt="" className="size-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[21/9] w-full rounded-xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background" />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={cn("border-transparent", phaseMeta.className)}>{phaseMeta.label}</Badge>
          <Badge variant="secondary">#{e.id.toString()}</Badge>
        </div>
        <h1 className="m-0 text-3xl font-bold tracking-tight [overflow-wrap:anywhere]">{e.title}</h1>
        <p className="m-0 text-lg text-muted-foreground [overflow-wrap:anywhere]">{e.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="grid gap-3 py-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  Cuándo
                </p>
                <p className="m-0 font-medium">{formatEventDate(e.startsAt)}</p>
              </div>
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <MapPin className="size-3.5" />
                  Dónde
                </p>
                <p className="m-0 font-medium [overflow-wrap:anywhere]">{e.location}</p>
              </div>
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Users className="size-3.5" />
                  Capacidad
                </p>
                <p className="m-0 font-medium">
                  {e.maxAttendees === 0n ? "Sin límite" : `${attendeeList.length} de ${e.maxAttendees.toString()}`}
                </p>
              </div>
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Organiza
                </p>
                <Address address={e.creator} />
              </div>
            </CardContent>
          </Card>

          {hasMetadata(e.metadataHash as string) && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                {metadataQuery.isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-24" />
                  </div>
                ) : metadataQuery.isError ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="m-0 text-sm text-muted-foreground">
                      {metadataQuery.error instanceof Error
                        ? metadataQuery.error.message
                        : "No se pudieron cargar los detalles."}
                    </p>
                    <Button variant="outline" size="sm" onClick={() => metadataQuery.refetch()}>
                      <RefreshCw className="size-4" />
                      Reintentar
                    </Button>
                  </div>
                ) : metadataQuery.data === undefined ? null : (
                  <Markdown>{metadataQuery.data.description}</Markdown>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Quién va ({attendeeList.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendeeList.length === 0 ? (
                <p className="m-0 py-4 text-center text-sm text-muted-foreground">
                  Nadie se apuntó todavía. ¡Sé el primero!
                </p>
              ) : (
                <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                  {attendeeList.map(attendee => (
                    <li
                      key={attendee}
                      className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"
                    >
                      <BlockieAvatar address={attendee} size={20} />
                      <span className="font-mono text-xs">{shortAddress(attendee)}</span>
                      {attendee.toLowerCase() === address?.toLowerCase() && (
                        <Badge variant="secondary" className="font-normal">
                          Tú
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Side: actions */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Qué puedes hacer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {phase === "cancelled" && (
                <p className="m-0 text-sm text-muted-foreground">
                  Este evento fue cancelado. {isAlreadyRegistered ? "Tu inscripción figura solo como registro." : ""}
                </p>
              )}

              {phase === "past" && (
                <p className="m-0 text-sm text-muted-foreground">
                  Este evento ya pasó. {isAlreadyRegistered ? "Figurás en la lista de asistentes." : ""}
                </p>
              )}

              {phase === "upcoming" && address === undefined && (
                <p className="m-0 text-sm text-muted-foreground">Conecta tu wallet para apuntarte.</p>
              )}

              {phase === "upcoming" && address !== undefined && !canRegister && !isAlreadyRegistered && (
                <p className="m-0 text-sm text-muted-foreground">Únete a la DAO para poder apuntarte.</p>
              )}

              {phase === "upcoming" && isAlreadyRegistered && (
                <>
                  <p className="m-0 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4" />
                    Estás apuntado
                  </p>
                  <Button variant="outline" className="w-full" disabled={busy} onClick={cancelRegistration}>
                    {spinner("cancel-registration") || <UserMinus className="size-4" />}
                    Cancelar inscripción
                  </Button>
                </>
              )}

              {phase === "upcoming" && !isAlreadyRegistered && canRegister && !isFull && (
                <Button className="w-full" disabled={busy} onClick={register}>
                  {spinner("register") || <UserPlus className="size-4" />}
                  Apuntarme
                </Button>
              )}

              {phase === "upcoming" && !isAlreadyRegistered && canRegister && isFull && (
                <p className="m-0 text-sm text-muted-foreground">
                  El evento está completo. Si alguien cancela, se abrirá un hueco.
                </p>
              )}

              {phase === "upcoming" && (isCreator || isAdmin) && (
                <div className="border-t pt-3">
                  <Button variant="destructive" className="w-full" disabled={busy} onClick={cancelEvent}>
                    {spinner("cancel-event") || <Ban className="size-4" />}
                    Cancelar el evento
                  </Button>
                  <p className="m-0 mt-2 flex items-start gap-2 text-xs text-muted-foreground">
                    <Clock className="mt-0.5 size-3.5 shrink-0" />
                    {isCreator ? "Puedes cancelar porque lo creaste." : "Puedes cancelar porque eres administrador."}
                  </p>
                </div>
              )}

              {phase === "upcoming" && coverName === undefined && !hasMetadata(e.metadataHash as string) && (
                <p className="m-0 flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <ImageIcon className="mt-0.5 size-3.5 shrink-0" />
                  Este evento se publicó sin descripción extendida ni portada.
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};
