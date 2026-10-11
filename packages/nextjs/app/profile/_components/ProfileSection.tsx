"use client";

import Link from "next/link";
import { Award, CalendarDays, ClipboardList, History, Lock, Medal, TrendingUp, UserCog } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { BlockieAvatar } from "~~/components/scaffold-eth/BlockieAvatar";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { getRoleLabel } from "~~/constants/roles";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useCurrentDao } from "~~/hooks/useCurrentDao";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useTasksAddress } from "~~/hooks/useTasksAddress";
import { TASK_STATUS_META } from "~~/lib/tasks";
import { formatRelativeTime, getEventTimestamp, shortAddress } from "~~/lib/utils";

const UPCOMING = [
  { icon: TrendingUp, title: "Nivel y experiencia", description: "Sube de nivel mientras más aportas a la DAO." },
  { icon: Award, title: "Insignias NFT", description: "Colecciona NFTs al alcanzar nuevos niveles." },
  {
    icon: History,
    title: "Historial de contribuciones",
    description: "Todo lo que has hecho en la DAO, en un solo lugar.",
  },
];

export const ProfileSection: React.FC = () => {
  const { address } = useAccount();
  const { daoAddress, dao } = useCurrentDao();
  const { roles, isLoading: rolesLoading } = useDaoRoles();
  const tasksAddress = useTasksAddress();

  const enabled = address !== undefined && daoAddress !== "";

  //smart contract
  const { data: joinEvents } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "UserJoined",
    contractAddress: daoAddress,
    fromBlock: 0n,
    filters: { user: address },
    blockData: true,
    enabled,
  });

  const { data: roleEvents } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "RoleRegistered",
    contractAddress: daoAddress,
    fromBlock: 0n,
    watch: true,
    filters: { user: address },
    blockData: true,
    enabled,
  });

  const { data: allTasks } = useScaffoldReadContract({
    contractName: "AgoraTasks",
    functionName: "getAllTasks",
    contractAddress: tasksAddress,
    query: { enabled: tasksAddress !== undefined },
  });

  //consts
  const isCreator = dao !== undefined && address !== undefined && dao.creator.toLowerCase() === address.toLowerCase();
  const memberSince = isCreator ? Number(dao.creationTimestamp) : getEventTimestamp(joinEvents?.[0] ?? {});

  // joining also emits RoleRegistered with no executor: only show the roles somebody assigned
  const assignedRoles = (roleEvents ?? [])
    .filter(x => x.args.executor !== "0x0000000000000000000000000000000000000000")
    .reverse();

  // the tasks this user published or is working on, newest first
  const myTasks = [...(allTasks ?? [])].reverse().flatMap(task => {
    const me = address?.toLowerCase();
    if (task.creator.toLowerCase() === me) return [{ task, role: "Creador" }];
    if (task.assignee.toLowerCase() === me) return [{ task, role: "Responsable" }];
    return [];
  });

  if (address === undefined) {
    return (
      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Conecta tu wallet</h1>
        <p className="m-0 mt-2 text-muted-foreground">Necesitamos tu wallet para mostrar tu perfil.</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="m-0 text-muted-foreground">
          Tu actividad en {dao?.name ?? "la DAO"}, tu nivel y lo que vayas logrando.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Identity */}
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col items-center gap-4 text-center">
            <BlockieAvatar address={address} size={96} />
            <Address address={address} />

            <div className="flex flex-wrap justify-center gap-1.5">
              {rolesLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : roles.length === 0 ? (
                <Badge variant="outline">Sin rol</Badge>
              ) : (
                roles.map(({ role, label }) => (
                  <Badge key={role} variant={label === roles[0].label ? "default" : "secondary"}>
                    {label}
                  </Badge>
                ))
              )}
            </div>

            {memberSince > 0 && (
              <p className="m-0 flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                {isCreator ? "Creaste esta DAO" : "Miembro"} {formatRelativeTime(memberSince)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Level (coming soon) */}
        <Card className="lg:col-span-3 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="size-5" />
              Nivel y reputación
              <Badge variant="outline" className="ml-auto font-normal">
                <Lock />
                Próximamente
              </Badge>
            </CardTitle>
            <CardDescription>
              Aquí verás tu progreso cuando esté listo el módulo de Reputación. Esto es lo que vendrá:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {UPCOMING.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-center gap-3 opacity-70">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="m-0 text-sm font-medium">{title}</p>
                    <p className="m-0 text-xs text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* My tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5" />
            Mis tareas
          </CardTitle>
          <CardDescription>Las que publicaste y las que tienes a tu cargo.</CardDescription>
        </CardHeader>
        <CardContent>
          {myTasks.length === 0 ? (
            <p className="m-0 py-4 text-center text-sm text-muted-foreground">
              Todavía no tienes tareas.{" "}
              <Link href="/task" className="text-primary underline underline-offset-2">
                Ver las tareas de la DAO
              </Link>
            </p>
          ) : (
            <ul className="m-0 list-none space-y-1 p-0">
              {myTasks.map(({ task, role }) => (
                <li key={task.id.toString()}>
                  <Link
                    href={`/task/${task.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="m-0 truncate text-sm font-medium">{task.title}</p>
                      <p className="m-0 text-xs text-muted-foreground">
                        {role} · {formatEther(task.reward)} ETH
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {TASK_STATUS_META[task.status]?.label}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Roles received */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="size-5" />
            Roles que te han asignado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assignedRoles.length === 0 ? (
            <p className="m-0 py-4 text-center text-sm text-muted-foreground">Nadie te ha asignado un rol todavía.</p>
          ) : (
            <ul className="space-y-3">
              {assignedRoles.map(x => (
                <li key={`${x.transactionHash}-${x.logIndex}`} className="flex items-center gap-3 text-sm">
                  <Badge variant="secondary">{getRoleLabel(x.args.role as string)}</Badge>
                  <span className="min-w-0 flex-1 text-muted-foreground">
                    asignado por {shortAddress(x.args.executor as string)}
                  </span>
                  {getEventTimestamp(x) > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(getEventTimestamp(x))}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
};
