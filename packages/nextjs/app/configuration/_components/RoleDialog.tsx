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

type RoleDialogProps = {
  role: Role;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

//TODO: tengo que hacer que el input tenga un + y - para eliminar y agrgar address, tambien tengo que verificar dichas address y por ultimo enviar el [] listo al contract
//TODO: verificar que no se pueda agregar la address del que esta conectado
//TODO: si el rol del que está conectado no cumple con los requisitos apagarle el button

export const RoleDialog: React.FC<RoleDialogProps> = ({ role }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
          <span className="sr-only">Agregar {role.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar {role.name}</DialogTitle>
          <DialogDescription>Ingresa la dirección del usuario que deseas agregar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input id="name" value={role.name} onChange={e => console.log(e.target.value)} />
          </div>

          {/*  
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
          </div> */}
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
