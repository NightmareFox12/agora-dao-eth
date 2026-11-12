"use client";

import Link from "next/link";
import { RoleCard } from "./RoleCard";
import { RoleLastChangesDialog } from "./RoleLastChangesDialog";
import { CONFIGURATION_TOUR_ID, configurationTourSteps } from "./configuration.tour";
import { useAccount } from "wagmi";
import { TourButton } from "~~/components/TourButton";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import {
  AUDITOR_ROLE,
  DEFAULT_ADMIN_ROLE,
  PROPOSAL_MANAGER_ROLE,
  TASK_MANAGER_ROLE,
  USER_ROLE,
} from "~~/constants/roles";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useTour } from "~~/hooks/useTour";
import { useDaoStore } from "~~/services/store/dao.store";

export type Role = {
  label: string;
  bytes: `0x${string}`;
  description: string;
  /** What the contracts let this role do, in the user's words */
  permissions: string[];
};

// Same rules the contracts enforce (AgoraTasks, AgoraVotes, AgoraEvents). Keep them in sync.
export const ASSIGNABLE_ROLES: Role[] = [
  {
    label: "Gestor de tareas",
    bytes: TASK_MANAGER_ROLE,
    description: "Publica el trabajo que la DAO necesita y decide si una entrega está bien.",
    permissions: [
      "Publica tareas y deposita su recompensa al hacerlo",
      "Aprueba o pide cambios en las entregas de sus tareas",
      "Cancela sus tareas mientras nadie las haya tomado",
    ],
  },
  {
    label: "Gestor de propuestas",
    bytes: PROPOSAL_MANAGER_ROLE,
    description: "Lleva a votación las decisiones de la DAO.",
    permissions: ["Publica propuestas de texto", "Publica propuestas de pago desde la tesorería"],
  },
  {
    label: "Auditor",
    bytes: AUDITOR_ROLE,
    description: "Resuelve los desacuerdos entre quien publicó una tarea y quien la hizo.",
    permissions: [
      "Decide una disputa: paga al responsable o devuelve la recompensa al creador",
      "No puede decidir en tareas en las que participa",
    ],
  },
  {
    label: "Miembro",
    bytes: USER_ROLE,
    description: "Todo el que se une a la DAO. También puedes añadir miembros desde aquí.",
    permissions: [
      "Toma tareas abiertas y entrega el trabajo",
      "Vota en las propuestas",
      "Publica eventos y se apunta a ellos",
      "Gana puntos e insignias por participar",
    ],
  },
];

export const RoleConfig: React.FC = () => {
  const { daoAddress } = useDaoStore();
  const { address: userAddress } = useAccount();

  //smart contract
  const { data: isAdmin, isLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    args: [DEFAULT_ADMIN_ROLE, userAddress],
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" && userAddress !== undefined },
  });
  const { data: admins } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberByRole",
    args: [DEFAULT_ADMIN_ROLE],
    contractAddress: daoAddress,
    query: { enabled: daoAddress !== "" },
  });

  //tour
  const { start: startTour } = useTour(CONFIGURATION_TOUR_ID, configurationTourSteps, { ready: isAdmin === true });

  if (isLoading || isAdmin === undefined) {
    return (
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map(x => (
            <Skeleton key={x} className="h-56" />
          ))}
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="container mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
        <h1 className="m-0 text-2xl font-bold">Solo para el administrador</h1>
        <p className="m-0 text-muted-foreground">
          Desde aquí se asignan y quitan roles. El administrador de esta DAO es quien la creó
          {admins?.[0] !== undefined && (
            <>
              : <Address address={admins[0]} size="sm" />
            </>
          )}
        </p>
        <Button asChild variant="outline">
          <Link href="/dao">Volver al inicio</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="m-0 text-3xl font-bold tracking-tight">Roles</h1>
          <p className="m-0 text-muted-foreground">
            Quién puede hacer qué en la DAO. Una persona puede tener varios roles a la vez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RoleLastChangesDialog daoAddress={daoAddress} />
          <TourButton onClick={startTour} />
        </div>
      </div>

      <section data-tour="roles" className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {ASSIGNABLE_ROLES.map((role, index) => (
          <RoleCard key={role.bytes} role={role} tour={index === 0 ? "role-card" : undefined} />
        ))}
      </section>
    </main>
  );
};
