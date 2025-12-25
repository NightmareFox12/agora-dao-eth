"use client";

import { useRouter } from "next/navigation";
import { RoleCard } from "./RoleCard";
import { ArrowLeft, Settings, Shield } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/components/ui/shadcn/dialog";
import { AUDITOR_ROLE, DEFAULT_ADMIN_ROLE, TASK_MANAGER_ROLE, USER_ROLE } from "~~/constants/roles";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDaoStore } from "~~/services/store/dao.store";

export type Role = {
  name: string;
  bytes: `0x${string}`;
  description: string;
  permissions: string[];
  color: string;
};

const initialRoles: Role[] = [
  {
    name: "AUDITOR",
    bytes: AUDITOR_ROLE,
    description: "Puede revisar y auditar todas las transacciones y propuestas de la DAO",
    permissions: ["Ver transacciones", "Generar reportes", "Auditar propuestas", "Acceso de solo lectura"],
    color: "bg-amber-500",
  },
  {
    name: "TASK_MANAGER",
    bytes: TASK_MANAGER_ROLE,
    description: "Gestiona y asigna tareas dentro de la organización",
    permissions: ["Crear tareas", "Asignar miembros", "Establecer deadlines", "Aprobar entregas"],
    color: "bg-blue-500",
  },
  {
    name: "USUARIO",
    bytes: USER_ROLE,
    description: "Miembro estándar con capacidad de votar y crear propuestas básicas",
    permissions: ["Votar propuestas", "Crear propuestas", "Ver dashboard", "Participar en discusiones"],
    color: "bg-emerald-500",
  },
] as const;

export const RoleConfig: React.FC = () => {
  const { daoAddress } = useDaoStore();
  const { address: userAddress } = useAccount();
  const router = useRouter();

  //smart contract
  const { data: isAdmin } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    args: [DEFAULT_ADMIN_ROLE, userAddress],
    contractAddress: daoAddress,
  });

  if (!isAdmin)
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogTrigger className="hidden">Open</DialogTrigger>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>🚫 Sección restringida</DialogTitle>
            <DialogDescription className="text-center">
              Solo el administrador puede acceder a esta sección.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </Button>
        </DialogContent>
      </Dialog>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Configuración de la DAO</h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Administra los roles y permisos de los miembros de tu organización descentralizada
        </p>
      </div>

      {/* Roles Section */}
      <section>
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Gestión de Roles</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {initialRoles.map((role, y) => (
            <RoleCard key={y} role={role} />
          ))}
        </div>
      </section>
    </div>
  );
};
