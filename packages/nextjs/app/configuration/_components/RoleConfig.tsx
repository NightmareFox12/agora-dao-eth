"use client";

import { useRouter } from "next/navigation";
import { RoleCard } from "./RoleCard";
import { RoleLastChangesDialog } from "./RoleLastChangesDialog";
import { ArrowLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
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
        <DialogTrigger className="hidden">Abrir</DialogTrigger>
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
    <div className="container mx-auto px-4 py-4 max-w-6xl">
      <section>
        <Tabs defaultValue="role" className="w-full">
          <TabsList className="w-full justify-center">
            <TabsTrigger value="role">Gestionar roles</TabsTrigger>
            <TabsTrigger value="permission">Gestionar permisos</TabsTrigger>
          </TabsList>
          {/* Role section */}
          <TabsContent value="role">
            <RoleLastChangesDialog daoAddress={daoAddress} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              {initialRoles.map((role, y) => (
                <RoleCard key={y} role={role} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="permission">Gestionar permisos</TabsContent>
        </Tabs>
      </section>
    </div>
  );
};
