import { useState } from "react";
import { Role } from "./RoleConfig";
import { Plus, Trash2, UserCheck } from "lucide-react";
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
};

export const RoleDialog: React.FC<RoleDialogProps> = ({ role }) => {
  const [inputs, setInputs] = useState<string[]>([""]);

  const addInput = () => {
    setInputs([...inputs, ""]);
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const checkInputError = (value: string): string | null => {
    if (value.length > 0 && !value.match(/^0x[a-fA-F0-9]{40}$/)) {
      return "Por favor, ingresa una dirección válida";
    }
    return null;
  };
  // Función para eliminar un input (opcional pero recomendada)
  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index));
    }
  };

  const handleSave = () => {
    // Aquí tienes todos los datos guardados en el array 'inputs'
    console.log("Datos a guardar:", inputs);
  };

  //memos
  //TODO: me falta comprobar si hay [""]
  const hasErrors = inputs.some(value => checkInputError(value) !== null);

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
          <DialogDescription>Puedes agregar varias direcciones usando el botón con el simbolo +.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto px-1">
          {inputs.map((value, index) => {
            const error = checkInputError(value);
            return (
              <div key={index} className={`flex items-center gap-2 ${error ? "py-1.5" : ""}`}>
                <div className="w-full">
                  <Input
                    placeholder="Dirección del usuario"
                    value={value}
                    onChange={e => handleInputChange(index, e.target.value)}
                    maxLength={42}
                    className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {error ? (
                    <span className="text-xs absolute pl-1 text-destructive font-semibold pt-0.5">{error}</span>
                  ) : null}
                </div>

                {index === inputs.length - 1 ? (
                  <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={addInput}>
                    <Plus className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0 text-destructive"
                    onClick={() => removeInput(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={() => setInputs([""])}>
            <Trash2 className="h-4 w-4" />
            Eliminar todo
          </Button>
          <Button onClick={handleSave} disabled={hasErrors}>
            <UserCheck className="h-4 w-4" />
            Crear {inputs.length > 1 ? "roles" : "rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
