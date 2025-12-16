import { Role } from "./RoleConfig";
import { Plus } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
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

type RoleDialogProps = {
  role: Role;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const RoleDialog: React.FC<RoleDialogProps> = ({ role }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
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
            {/* <Input
                      id="name"
                      value={editedRole.name}
                      onChange={e => setEditedRole({ ...editedRole, name: e.target.value })}
                    /> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            {/* <Textarea
                      id="description"
                      value={editedRole.description}
                      onChange={e => setEditedRole({ ...editedRole, description: e.target.value })}
                      rows={3}
                    /> */}
          </div>

          <div className="space-y-2">
            <Label>Permisos</Label>
            <div className="flex flex-wrap gap-2">
              {/* {editedRole.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {permission}
                        </Badge>
                      ))} */}
            </div>
            <Input
              placeholder="Agregar nuevo permiso y presiona Enter"
              onKeyDown={e => {
                console.log(e);
                //     if (e.key === "Enter" && e.currentTarget.value.trim()) {
                //       setEditedRole({
                //         ...editedRole,
                //         permissions: [...editedRole.permissions, e.currentTarget.value.trim()],
                //       });
                //       e.currentTarget.value = "";
                //     }
                //   }}
              }}
            />
          </div>
        </div>

        <DialogFooter>
          {/* <Button variant="outline" onClick={() => setIsOpen(false)}> */}
          <Button variant="outline" onClick={() => console.log("first")}>
            Cancelar
          </Button>
          <Button onClick={() => console.log("s")}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
