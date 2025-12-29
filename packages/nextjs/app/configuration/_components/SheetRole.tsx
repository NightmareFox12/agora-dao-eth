"use client";

import { Role } from "./RoleConfig";
import { RoleDialog } from "./RoleDialog";
import { Eye, Trash2 } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~~/components/ui/shadcn/sheet";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/shadcn/tooltip";

type SheetRoleProps = {
  daoAddress: string;
  role: Role;
  members: readonly string[] | undefined;
  membersLoading: boolean;
};

export const SheetRole: React.FC<SheetRoleProps> = ({ daoAddress, role, members, membersLoading }) => {
  //states

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon">
          <Eye className="h-4 w-4" />
          <span className="sr-only">Editar rol</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="lg:max-w-lg">
        <SheetHeader>
          <SheetTitle>Miembros: {role.name}</SheetTitle>
          <SheetDescription>
            Gestiona los miembros asignados al rol {role.name}. Utiliza los botones en la tabla para agregar o eliminar.
          </SheetDescription>
        </SheetHeader>

        {membersLoading ? (
          Array(10)
            .fill(0)
            .map((_, key) => <Skeleton key={key} className="w-full h-8" />)
        ) : members === undefined || members.length === 0 ? (
          <div>
            <h2 className="font-bold text-xl text-center mt-40">Aún no hay miembros con este rol</h2>
            <div className="flex justify-center mt-4">
              <RoleDialog daoAddress={daoAddress} role={role} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center -mt-7">
              <RoleDialog daoAddress={daoAddress} role={role} />
            </div>
            <Table>
              <TableCaption>Lista de {role.name}.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">ID</TableHead>
                  <TableHead className="text-center">Address</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell className="text-center flex mt-1.5 justify-center">
                      <Address address={member} disableAddressLink size="sm" />
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Editar rol</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Ver usuario</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Eliminar usuario</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
