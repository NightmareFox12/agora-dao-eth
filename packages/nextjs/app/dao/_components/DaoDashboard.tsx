"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DASHBOARD_TOUR_ID, dashboardTourSteps } from "./dashboard.tour";
import { ChevronRight, Crown, Image as ImageIcon, UserCog, UserPlus } from "lucide-react";
import { formatEther } from "viem";
import { TourButton } from "~~/components/TourButton";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import {
  AUDITOR_ROLE,
  DEFAULT_ADMIN_ROLE,
  PROPOSAL_MANAGER_ROLE,
  TASK_MANAGER_ROLE,
  getRoleLabel,
} from "~~/constants/roles";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useCurrentDao } from "~~/hooks/useCurrentDao";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useEventsAddress } from "~~/hooks/useEventsAddress";
import { useTasksAddress } from "~~/hooks/useTasksAddress";
import { useTour } from "~~/hooks/useTour";
import { useTreasuryAddress } from "~~/hooks/useTreasuryAddress";
import { useVotesAddress } from "~~/hooks/useVotesAddress";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { type EventData, formatEventDate, getEventPhase } from "~~/lib/events";
import { getLogoUrl } from "~~/lib/storage";
import { TASK_STATUS } from "~~/lib/tasks";
import { formatRelativeTime, getEventTimestamp, shortAddress } from "~~/lib/utils";
import { PROPOSAL_STATUS } from "~~/lib/votes";

export const DaoDashboard: React.FC = () => {
  const { daoAddress, dao, categories, isLoading: daoLoading } = useCurrentDao();
  const { mainRole, roles, isLoading: rolesLoading } = useDaoRoles();
  const tasksAddress = useTasksAddress();
  const votesAddress = useVotesAddress();
  const treasuryAddress = useTreasuryAddress();
  const eventsAddress = useEventsAddress();

  const enabled = daoAddress !== "";

  //smart contract
  const { data: userCounter } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "userCounter",
    contractAddress: daoAddress,
    query: { enabled },
  });

  const { data: admins } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberByRole",
    args: [DEFAULT_ADMIN_ROLE],
    contractAddress: daoAddress,
    query: { enabled },
  });
  const { data: auditors } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberByRole",
    args: [AUDITOR_ROLE],
    contractAddress: daoAddress,
    query: { enabled },
  });
  const { data: taskManagers } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberByRole",
    args: [TASK_MANAGER_ROLE],
    contractAddress: daoAddress,
    query: { enabled },
  });
  const { data: proposalManagers } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberByRole",
    args: [PROPOSAL_MANAGER_ROLE],
    contractAddress: daoAddress,
    query: { enabled },
  });

  // what is going on in each module right now
  const { data: tasks } = useScaffoldReadContract({
    contractName: "AgoraTasks",
    functionName: "getAllTasks",
    contractAddress: tasksAddress,
    query: { enabled: tasksAddress !== undefined },
  });
  const { data: proposals } = useScaffoldReadContract({
    contractName: "AgoraVotes",
    functionName: "getAllProposals",
    contractAddress: votesAddress,
    query: { enabled: votesAddress !== undefined },
  });
  const { data: treasuryBalance } = useScaffoldReadContract({
    contractName: "AgoraTreasury",
    functionName: "balance",
    contractAddress: treasuryAddress,
    query: { enabled: treasuryAddress !== undefined },
  });
  const { data: events } = useScaffoldReadContract({
    contractName: "AgoraEvents",
    functionName: "getAllEvents",
    contractAddress: eventsAddress,
    query: { enabled: eventsAddress !== undefined },
  });

  const { data: joinEvents, isLoading: joinsLoading } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "UserJoined",
    contractAddress: daoAddress,
    fromBlock: 0n,
    watch: true,
    blockData: true,
    enabled,
  });
  const { data: roleEvents, isLoading: roleEventsLoading } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "RoleRegistered",
    contractAddress: daoAddress,
    fromBlock: 0n,
    watch: true,
    blockData: true,
    enabled,
  });

  //memos
  // the creator, auditors and managers: people who run the DAO (a person with two roles counts once)
  const teamSize = useMemo(() => {
    const team = [...(admins ?? []), ...(auditors ?? []), ...(taskManagers ?? []), ...(proposalManagers ?? [])];
    return new Set(team.map(x => x.toLowerCase())).size;
  }, [admins, auditors, taskManagers, proposalManagers]);

  const activity = useMemo(() => {
    const joins = (joinEvents ?? []).map(x => ({
      key: `${x.transactionHash}-${x.logIndex}`,
      kind: "join" as const,
      user: x.args.user as string,
      text: "se unió a la DAO",
      timestamp: getEventTimestamp(x),
      order: Number(x.blockNumber ?? 0n) * 1000 + Number(x.logIndex ?? 0),
    }));

    // joining also emits RoleRegistered with no executor: only keep the roles somebody assigned
    const assignments = (roleEvents ?? [])
      .filter(x => x.args.executor !== "0x0000000000000000000000000000000000000000")
      .map(x => ({
        key: `${x.transactionHash}-${x.logIndex}`,
        kind: "role" as const,
        user: x.args.user as string,
        text: `recibió el rol de ${getRoleLabel(x.args.role as string).toLowerCase()}`,
        timestamp: getEventTimestamp(x),
        order: Number(x.blockNumber ?? 0n) * 1000 + Number(x.logIndex ?? 0),
      }));

    return [...joins, ...assignments].sort((a, b) => b.order - a.order).slice(0, 6);
  }, [joinEvents, roleEvents]);

  const openTasks = tasks === undefined ? undefined : tasks.filter(t => t.status === TASK_STATUS.Open).length;
  const openTasksReward =
    tasks === undefined
      ? undefined
      : tasks.filter(t => t.status === TASK_STATUS.Open).reduce((sum, t) => sum + t.reward, 0n);
  const activeProposals =
    proposals === undefined ? undefined : proposals.filter(p => p.status === PROPOSAL_STATUS.Active).length;
  const nextEvent = useMemo(() => {
    const upcoming = ((events ?? []) as readonly EventData[]).filter(e => getEventPhase(e) === "upcoming");
    return upcoming.sort((a, b) => Number(a.startsAt - b.startsAt))[0];
  }, [events]);

  //tour
  const { start: startTour } = useTour(DASHBOARD_TOUR_ID, dashboardTourSteps, { ready: dao !== undefined });

  // the saved DAO is not in the factory anymore (for example after redeploying the contracts)
  if (!daoLoading && dao === undefined) {
    return (
      <main className="container mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="m-0 text-2xl font-bold">No encontramos esta DAO</h1>
        <p className="m-0 text-muted-foreground">
          La DAO que tenías guardada ya no existe en esta red. Sal de ella para elegir otra de la lista.
        </p>
        <Button asChild>
          <Link href="/logout">Salir de esta DAO</Link>
        </Button>
      </main>
    );
  }

  if (daoLoading || dao === undefined) {
    return (
      <main className="container mx-auto space-y-6 px-4 py-6">
        <Skeleton className="h-44 w-full" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map(x => (
            <Skeleton key={x} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  const daysOld = Math.max(0, Math.floor((Date.now() / 1000 - Number(dao.creationTimestamp)) / 86400));

  const facts = [
    {
      tour: "my-role",
      label: "Tu rol",
      value: rolesLoading ? <Skeleton className="h-8 w-28" /> : (mainRole?.label ?? "Sin rol"),
      hint: roles.length > 1 ? `y ${roles.length - 1} más` : undefined,
    },
    { label: "Miembros", value: userCounter?.toString() ?? <Skeleton className="h-8 w-12" /> },
    { label: "Equipo", value: teamSize, hint: "administran la DAO" },
    { label: "Antigüedad", value: daysOld === 0 ? "Hoy" : `${daysOld} ${daysOld === 1 ? "día" : "días"}` },
  ];

  // one line per module, with the number that matters today and where to go
  const now = [
    {
      href: "/task",
      label: "Tareas abiertas",
      value: openTasks,
      detail:
        openTasksReward !== undefined && openTasksReward > 0n
          ? `${formatEther(openTasksReward)} ETH en juego`
          : undefined,
    },
    { href: "/vote", label: "Propuestas en votación", value: activeProposals },
    {
      href: "/treasury",
      label: "Saldo de la tesorería",
      value: treasuryBalance === undefined ? undefined : `${formatEther(treasuryBalance)} ETH`,
    },
    {
      href: "/events",
      label: "Próximo evento",
      value: events === undefined ? undefined : nextEvent === undefined ? "Ninguno" : nextEvent.title,
      detail: nextEvent === undefined ? undefined : formatEventDate(nextEvent.startsAt),
    },
  ];

  return (
    <main className="container mx-auto space-y-6 px-4 py-6">
      {/* DAO */}
      <Card data-tour="dao-hero">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {dao.imageURI.length > 4 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getLogoUrl(dao.imageURI)} alt={dao.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-9 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 break-words text-3xl font-bold tracking-tight">{dao.name}</h1>
              <Badge variant="secondary">#{dao.daoID.toString()}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(category => (
                <Badge key={category.id} variant="outline" className={getCategoryStyle(category.id).soft}>
                  {category.name.toLowerCase()}
                </Badge>
              ))}
            </div>
            <p className="m-0 break-words text-muted-foreground">{dao.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="size-4" />
              Creada por <Address address={dao.creator} />
            </div>
          </div>

          <TourButton onClick={startTour} />
        </CardContent>
      </Card>

      {/* Facts */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {facts.map(({ tour, label, value, hint }) => (
          <Card key={label} data-tour={tour} className="gap-1 py-4">
            <CardHeader className="pb-0">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              {hint !== undefined && <p className="m-0 text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Now in the DAO */}
        <Card data-tour="now" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Ahora en la DAO</CardTitle>
            <CardDescription>Lo que hay abierto en cada módulo</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="m-0 list-none divide-y p-0">
              {now.map(({ href, label, value, detail }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-3 py-3 transition-colors hover:text-primary">
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm text-muted-foreground">{label}</p>
                      {value === undefined ? (
                        <Skeleton className="mt-1 h-6 w-20" />
                      ) : (
                        <p className="m-0 truncate text-lg font-semibold">{value}</p>
                      )}
                      {detail !== undefined && <p className="m-0 text-xs text-muted-foreground">{detail}</p>}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Activity */}
        <Card data-tour="activity" className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Quién se une y qué roles se asignan</CardDescription>
          </CardHeader>
          <CardContent>
            {joinsLoading || roleEventsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(x => (
                  <Skeleton key={x} className="h-10" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="m-0 py-6 text-center text-sm text-muted-foreground">Todavía no hay actividad.</p>
            ) : (
              <ul className="m-0 list-none space-y-3 p-0">
                {activity.map(item => (
                  <li key={item.key} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      {item.kind === "join" ? <UserPlus className="size-4" /> : <UserCog className="size-4" />}
                    </div>
                    <p className="m-0 min-w-0 flex-1 text-sm">
                      <span className="font-medium">{shortAddress(item.user)}</span> {item.text}
                    </p>
                    {item.timestamp > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
