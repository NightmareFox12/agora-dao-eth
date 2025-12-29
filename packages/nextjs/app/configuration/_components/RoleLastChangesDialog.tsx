"use client";

import React, { useMemo } from "react";
import { List } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/shadcn/dialog";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~~/components/ui/shadcn/table";
import { AUDITOR_ROLE, PROPOSAL_MANAGER_ROLE, TASK_MANAGER_ROLE, USER_ROLE } from "~~/constants/roles";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";

const rolesArr = {
  [AUDITOR_ROLE]: "Auditor",
  [TASK_MANAGER_ROLE]: "Gestor de tareas",
  [PROPOSAL_MANAGER_ROLE]: "Gestor de propuestas",
  [USER_ROLE]: "Usuario",
} as const;

type RoleLastChangesDialogProps = {
  daoAddress: string;
};

export const RoleLastChangesDialog: React.FC<RoleLastChangesDialogProps> = ({ daoAddress }) => {
  //smart contract
  const {
    data: events,
    isLoading: isLoadingEvents,
    // error: errorReadingEvents,
  } = useScaffoldEventHistory({
    contractName: "AgoraDao",
    eventName: "RoleRegistered",
    fromBlock: 0n,
    contractAddress: daoAddress,
    watch: true,
    blockData: true,
    transactionData: true,
    receiptData: true,
  });

  console.log(events);
  //memos
  const lastChanges = useMemo(() => {
    if (!events) return [];
    return events.slice(0, 5);
  }, [events]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex justify-center items-center w-full mt-3">
          <Button className="w-[300px]">
            <List className="size-5" />
            Ver últimos cambios
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Últimos cambios</DialogTitle>
        </DialogHeader>

        {isLoadingEvents ? (
          Array(5)
            .fill(0)
            .map((_, y) => <Skeleton key={y} className="w-full h-7" />)
        ) : (
          <Table>
            <TableCaption>Lista de los últimos roles modificados.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Address</TableHead>
                <TableHead className="text-center">Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lastChanges.map((event, index) => {
                if (!event.args.role || !event.args.user) return null;
                return (
                  <TableRow key={index}>
                    <TableCell className="flex justify-center">
                      <Address address={event.args.user} />
                    </TableCell>
                    <TableCell className="text-center">{rolesArr[event.args.role]}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
