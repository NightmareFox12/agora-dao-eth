"use client";

import React, { useState } from "react";
import { Role } from "./RoleConfig";
import { CheckCircle2, Eye, Users } from "lucide-react";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~~/components/ui/shadcn/dialog";
import { Input } from "~~/components/ui/shadcn/input";
import { Label } from "~~/components/ui/shadcn/label";
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
import { Textarea } from "~~/components/ui/shadcn/textarea";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

interface RoleCardProps {
  role: Role;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role }) => {
  const { daoAddress } = useDaoStore();

  //states
  const [isOpen, setIsOpen] = useState(false);
  const [editedRole, setEditedRole] = useState<Role>(role);

  const handleSave = () => {
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setEditedRole(role);
    }
  };

  //Smart contract
  const { data: memberCount, isLoading: memberCountLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "getMemberCount",
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
              {memberCountLoading ? (
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Users className="h-3.5 w-3.5" />
                  <Skeleton className="w-20 h-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{memberCount === undefined ? 0 : memberCount} miembros</span>
                </div>
              )}
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Eye className="h-4 w-4" />
                <span className="sr-only">Editar rol</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="lg:max-w-lg">
              <SheetHeader>
                <SheetTitle>{role.name}</SheetTitle>
                <SheetDescription>
                  This action cannot be undone. This will permanently delete your account and remove your data from our
                  servers.
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
                        <TableCell className="font-medium">INV001</TableCell>
                        <TableCell>Paid</TableCell>
                        <TableCell>Credit Card</TableCell>
                        <TableCell className="text-right">$250.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Editar rol</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Editar Rol</DialogTitle>
                        <DialogDescription>Modifica los detalles y permisos del rol {role.name}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre del Rol</Label>
                          <Input
                            id="name"
                            value={editedRole.name}
                            onChange={e => setEditedRole({ ...editedRole, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Descripción</Label>
                          <Textarea
                            id="description"
                            value={editedRole.description}
                            onChange={e => setEditedRole({ ...editedRole, description: e.target.value })}
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Permisos</Label>
                          <div className="flex flex-wrap gap-2">
                            {editedRole.permissions.map((permission, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                          <Input
                            placeholder="Agregar nuevo permiso y presiona Enter"
                            onKeyDown={e => {
                              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                setEditedRole({
                                  ...editedRole,
                                  permissions: [...editedRole.permissions, e.currentTarget.value.trim()],
                                });
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSave}>Guardar cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
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
