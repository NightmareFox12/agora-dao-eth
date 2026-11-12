"use client";

import React from "react";
import { Role } from "./RoleConfig";
import { SheetRole } from "./SheetRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

export const RoleCard: React.FC<{ role: Role; tour?: string }> = ({ role, tour }) => {
  const { daoAddress } = useDaoStore();

  //smart contract
  const { data: members, isLoading: membersLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getAllByRole",
    args: [role.bytes],
    contractAddress: daoAddress,
  });

  const count = members?.length ?? 0;

  return (
    <Card data-tour={tour}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-lg">{role.label}</CardTitle>
          {membersLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <p className="m-0 text-sm text-muted-foreground">
              {count === 0 ? "Nadie todavía" : `${count} ${count === 1 ? "persona" : "personas"}`}
            </p>
          )}
        </div>
        <SheetRole daoAddress={daoAddress} role={role} members={members} membersLoading={membersLoading} />
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription>{role.description}</CardDescription>
        <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
          {role.permissions.map(permission => (
            <li key={permission}>{permission}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
