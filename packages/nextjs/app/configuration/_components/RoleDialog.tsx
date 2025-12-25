import { useState } from "react";
import { Role } from "./RoleConfig";
import { Loader2, Plus, Trash2, UserCheck } from "lucide-react";
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
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type RoleDialogProps = {
  daoAddress: string;
  role: Role;
};

export const RoleDialog: React.FC<RoleDialogProps> = ({ role, daoAddress }) => {
  //states
  const [inputs, setInputs] = useState<string[]>([""]);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  //smart contract
  const { writeContractAsync: writeAgoraDaoAsync } = useScaffoldWriteContract({
    contractName: "AgoraDao",
    contractAddress: daoAddress,
  });

  // const { data: totalCounter } = useScaffoldReadContract({
  //   contractName: "YourContract",
  //   functionName: "userGreetingCounter",
  //   args: ["0xd8da6bf26964af9d7eed9e03e53415d37aa96045"],
  // });

  //functions
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

  const removeInput = (index: number) => {
    if (inputs.length > 1) {
      setInputs(inputs.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    try {
      setSubmitLoading(true);
      if (inputs.length === 0) return;

      if (inputs.length > 1) {
        await writeAgoraDaoAsync({
          functionName: "registerRoleBatch",
          args: [role.bytes, inputs],
        });
      } else {
        await writeAgoraDaoAsync({
          functionName: "registerRole",
          args: [role.bytes, inputs[0]],
        });
      }
      setInputs([""]);
    } catch (err) {
      console.log(err);
    } finally {
      setSubmitLoading(false);
    }
  };

  //memos
  const hasErrors = inputs.some(value => checkInputError(value) !== null || value.length === 0);

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
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 shrink-0"
                    onClick={() => setInputs([...inputs, ""])}
                  >
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
          <Button onClick={handleSave} disabled={hasErrors || submitLoading}>
            {submitLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Crear {inputs.length > 1 ? "roles" : "rol"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
