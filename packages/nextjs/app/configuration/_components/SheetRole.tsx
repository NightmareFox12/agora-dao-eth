"use client";

import { useState } from "react";
import { Role } from "./RoleConfig";
import { RoleDialog } from "./RoleDialog";
import { Eye } from "lucide-react";
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

type SheetRoleProps = {
  role: Role;
  members: readonly string[] | undefined;
  membersLoading: boolean;
};

export const SheetRole: React.FC<SheetRoleProps> = ({ role, members, membersLoading }) => {
  //states
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
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
              <RoleDialog role={role} isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <Skeleton className="w-20 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-20 h-4" />
                </TableCell>
                <TableCell>
                  <Skeleton className="w-20 h-4" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="w-20 h-4" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </SheetContent>
    </Sheet>
  );
};
