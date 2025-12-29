"use client";

import React from "react";
import { Role } from "./RoleConfig";
import { SheetRole } from "./SheetRole";
import { CheckCircle2, Users } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

interface RoleCardProps {
  role: Role;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role }) => {
  const { daoAddress } = useDaoStore();

  //Smart contract
  const { data: members, isLoading: membersLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getAllByRole",
    args: [role.bytes],
    contractAddress: daoAddress,
  });

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/20">
      {/* Color indicator bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${role.color}`} />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center`}>
              <span className="text-white font-bold text-sm">{role.name.charAt(0)}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{role.name}</CardTitle>
              {membersLoading ? (
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Users className="h-3.5 w-3.5" />
                  <Skeleton className="w-20 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Users className="h-3.5 w-3.5" />
                  <Badge variant="secondary">{members?.length ?? 0} miembros</Badge>
                </div>
              )}
            </div>
          </div>

          <SheetRole daoAddress={daoAddress} role={role} members={members} membersLoading={membersLoading} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">{role.description}</CardDescription>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Permisos</p>
          <ul className="space-y-1.5">
            {role.permissions.slice(0, 4).map((permission, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                {permission}
              </li>
            ))}
            {role.permissions.length > 4 && (
              <li className="text-xs text-muted-foreground">+{role.permissions.length - 4} más...</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
