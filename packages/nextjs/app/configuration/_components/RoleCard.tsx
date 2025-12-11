"use client";

import React, { useState } from "react";
import { Role } from "./RoleConfig";
import { CheckCircle2, Pencil, Users } from "lucide-react";
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
import { Textarea } from "~~/components/ui/shadcn/textarea";

interface RoleCardProps {
  role: Role;
}

export const RoleCard: React.FC<RoleCardProps> = ({ role }) => {
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
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <Users className="h-3.5 w-3.5" />
                <span>{role.memberCount} miembros</span>
              </div>
            </div>
          </div>

          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
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
