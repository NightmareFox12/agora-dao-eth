"use client";

import { useMemo } from "react";
import Link from "next/link";
import { DASHBOARD_TOUR_ID, dashboardTourSteps } from "./dashboard.tour";
import {
  Activity,
  CalendarDays,
  CircleQuestionMarkIcon,
  Crown,
  Files,
  Gift,
  Image as ImageIcon,
  Landmark,
  type LucideIcon,
  Medal,
  Shield,
  ShieldCheck,
  Ticket,
  UserCog,
  UserPlus,
  Users,
  Vote,
} from "lucide-react";
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
import { useTour } from "~~/hooks/useTour";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { getLogoUrl } from "~~/lib/storage";
import { cn, formatRelativeTime, getEventTimestamp, shortAddress } from "~~/lib/utils";

type Module = { name: string; description: string; icon: LucideIcon; href?: string; status: string };

const MODULES: Module[] = [
  {
    name: "Tareas",
    description: "Publica trabajos y paga al completarlos",
    icon: Files,
    href: "/task",
    status: "En desarrollo",
  },
  { name: "Votaciones", description: "Propuestas y decisiones de la DAO", icon: Vote, status: "Próximamente" },
  { name: "Tesorería", description: "Fondos de la DAO y pagos", icon: Landmark, status: "Próximamente" },
  {
    name: "Eventos públicos",
    description: "Actividades abiertas a la comunidad",
    icon: Ticket,
    status: "Próximamente",
  },
  { name: "Recompensas", description: "Tokens y NFTs por contribuir", icon: Gift, status: "Próximamente" },
  { name: "Reputación", description: "Niveles según cuánto aportas", icon: Medal, status: "Próximamente" },
];

export const DaoDashboard: React.FC = () => {
  const { daoAddress, dao, categories, isLoading: daoLoading } = useCurrentDao();
  const { mainRole, roles, isLoading: rolesLoading } = useDaoRoles();

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

  //tour
  const { start: startTour } = useTour(DASHBOARD_TOUR_ID, dashboardTourSteps, { ready: dao !== undefined });

  // the saved DAO is not in the factory anymore (for example after redeploying the contracts)
  if (!daoLoading && dao === undefined) {
    return (
      <main className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">No encontramos esta DAO</h1>
        <p className="m-0 max-w-md text-muted-foreground">
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
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(x => (
            <Skeleton key={x} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }

  const daysOld = Math.max(0, Math.floor((Date.now() / 1000 - Number(dao.creationTimestamp)) / 86400));

  const stats = [
    {
      tour: "my-role",
      icon: ShieldCheck,
      label: "Tu rol",
      value: rolesLoading ? <Skeleton className="h-8 w-28" /> : (mainRole?.label ?? "Sin rol"),
      hint: roles.length > 1 ? `Y ${roles.length - 1} más` : "En esta DAO",
    },
    {
      icon: Users,
      label: "Miembros",
      value: userCounter?.toString() ?? <Skeleton className="h-8 w-12" />,
      hint: "Incluye al creador",
    },
    {
      icon: Shield,
      label: "Equipo",
      value: teamSize,
      hint: "Administran la DAO",
    },
    {
      icon: CalendarDays,
      label: "Antigüedad",
      value: daysOld === 0 ? "Hoy" : `${daysOld} ${daysOld === 1 ? "día" : "días"}`,
      hint: "Desde su creación",
    },
  ];

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      {/* DAO */}
      <Card data-tour="dao-hero">
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="size-24 shrink-0 overflow-hidden rounded-xl border bg-primary/10 flex items-center justify-center">
            {dao.imageURI.length > 4 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getLogoUrl(dao.imageURI)} alt={dao.name} className="size-full object-cover" />
            ) : (
              <ImageIcon className="size-9 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight break-words">{dao.name}</h1>
              <Badge variant="secondary">#{dao.daoID.toString()}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map(category => (
                <Badge key={category.id} variant="outline" className={getCategoryStyle(category.id).soft}>
                  {category.name.toLowerCase()}
                </Badge>
              ))}
            </div>
            <p className="m-0 text-muted-foreground break-words">{dao.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="size-4" />
              Creada por <Address address={dao.creator} />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={startTour}>
            <CircleQuestionMarkIcon className="size-4" />
            Ver guía
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map(({ tour, icon: Icon, label, value, hint }) => (
          <Card key={label} data-tour={tour} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="m-0 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Activity */}
        <Card data-tour="activity" className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Actividad reciente
            </CardTitle>
            <CardDescription>Lo último que ha pasado en la DAO</CardDescription>
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
              <ul className="space-y-3">
                {activity.map(item => (
                  <li key={item.key} className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
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

        {/* Modules */}
        <Card data-tour="modules" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Módulos</CardTitle>
            <CardDescription>Lo que irá habilitando tu DAO</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {MODULES.map(({ name, description, icon: Icon, href, status }) => {
                const content = (
                  <>
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="m-0 text-sm font-medium">{name}</p>
                      <p className="m-0 truncate text-xs text-muted-foreground">{description}</p>
                    </div>
                    <Badge variant={href ? "default" : "outline"} className="shrink-0 font-normal">
                      {status}
                    </Badge>
                  </>
                );

                return (
                  <li key={name}>
                    {href ? (
                      <Link
                        href={href}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={cn("flex items-center gap-3 rounded-lg p-2", "opacity-70")}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
