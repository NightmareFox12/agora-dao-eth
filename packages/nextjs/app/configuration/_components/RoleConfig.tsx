"use client";

import { useEffect, useState } from "react";
import { RoleCard } from "./RoleCard";
import { Settings, Shield } from "lucide-react";
import { useHeaderStore } from "~~/services/store/header.store";

export type Role = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  memberCount: number;
  color: string;
};

const initialRoles: Role[] = [
  {
    id: "auditor",
    name: "AUDITOR",
    description: "Puede revisar y auditar todas las transacciones y propuestas de la DAO",
    permissions: ["Ver transacciones", "Generar reportes", "Auditar propuestas", "Acceso de solo lectura"],
    memberCount: 3,
    color: "bg-amber-500",
  },
  {
    id: "usuario",
    name: "USUARIO",
    description: "Miembro estándar con capacidad de votar y crear propuestas básicas",
    permissions: ["Votar propuestas", "Crear propuestas", "Ver dashboard", "Participar en discusiones"],
    memberCount: 45,
    color: "bg-emerald-500",
  },
  {
    id: "task_manager",
    name: "TASK_MANAGER",
    description: "Gestiona y asigna tareas dentro de la organización",
    permissions: ["Crear tareas", "Asignar miembros", "Establecer deadlines", "Aprobar entregas"],
    memberCount: 8,
    color: "bg-blue-500",
  },
  {
    id: "owner",
    name: "OWNER",
    description: "Propietario de la DAO con total control sobre todas las operaciones",
    permissions: ["Todo lo que el usuario puede hacer", "Administrar roles", "Gestionar miembros", "Acceso ilimitado"],
    memberCount: 1,
    color: "bg-primary",
  },
] as const;

export const RoleConfig: React.FC = () => {
  const { setShowHeader } = useHeaderStore();
  //states
  const [roles, setRoles] = useState<Role[]>(initialRoles);

  const handleUpdateRole = (updatedRole: Role) => {
    setRoles(roles.map(role => (role.id === updatedRole.id ? updatedRole : role)));
  };

  //effects
  useEffect(() => {
    setShowHeader(true);
  }, [setShowHeader]);

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
          {roles.map(role => (
            <RoleCard key={role.id} role={role} onUpdate={handleUpdateRole} />
          ))}
        </div>
      </section>
    </div>
  );
};
