"use client";

import { useState } from "react";
import { Role } from "./RoleConfig";
import { RoleDialog } from "./RoleDialog";
import { Loader, UserMinus, Users } from "lucide-react";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~~/components/ui/shadcn/dialog";
import { ScrollArea } from "~~/components/ui/shadcn/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~~/components/ui/shadcn/sheet";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { shortAddress } from "~~/lib/utils";

type SheetRoleProps = {
  daoAddress: string;
  role: Role;
  members: readonly string[] | undefined;
  membersLoading: boolean;
};

/** The people with a role: add more, or take the role away from one (the contract does not let you remove yourself). */
export const SheetRole: React.FC<SheetRoleProps> = ({ daoAddress, role, members, membersLoading }) => {
  const { address } = useAccount();

  //states
  const [toRemove, setToRemove] = useState<string>();
  const [removing, setRemoving] = useState(false);

  //smart contract
  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "AgoraDao", contractAddress: daoAddress });

  //functions
  const remove = async () => {
    if (toRemove === undefined) return;
    try {
      setRemoving(true);
      await writeContractAsync({ functionName: "deleteRole", args: [role.bytes, toRemove] });
      toast.success(`${shortAddress(toRemove)} ya no es ${role.label.toLowerCase()}.`);
      setToRemove(undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="size-4" />
          Gestionar
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 lg:max-w-lg">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>{role.label}</SheetTitle>
          <SheetDescription>{role.description}</SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between gap-2 px-6 py-3">
          <p className="m-0 text-sm text-muted-foreground">
            {membersLoading
              ? "Cargando…"
              : `${members?.length ?? 0} ${(members?.length ?? 0) === 1 ? "persona" : "personas"} con este rol`}
          </p>
          <RoleDialog daoAddress={daoAddress} role={role} />
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {membersLoading ? (
            <div className="space-y-2 px-6 pb-6">
              {[0, 1, 2].map(x => (
                <Skeleton key={x} className="h-12" />
              ))}
            </div>
          ) : members === undefined || members.length === 0 ? (
            <p className="m-0 px-6 py-10 text-center text-sm text-muted-foreground">
              Nadie tiene este rol todavía. Añade a alguien con «Añadir».
            </p>
          ) : (
            <ul className="m-0 list-none divide-y p-0">
              {members.map(member => {
                const isMe = address !== undefined && member.toLowerCase() === address.toLowerCase();
                return (
                  <li key={member} className="flex items-center justify-between gap-3 px-6 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Address address={member} size="sm" />
                      {isMe && <span className="text-xs text-muted-foreground">(tú)</span>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={isMe}
                      title={isMe ? "No puedes quitarte un rol a ti mismo" : undefined}
                      onClick={() => setToRemove(member)}
                    >
                      <UserMinus className="size-4" />
                      Quitar
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>

        <Dialog open={toRemove !== undefined} onOpenChange={open => !open && !removing && setToRemove(undefined)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Quitar el rol de {role.label.toLowerCase()}?</DialogTitle>
              <DialogDescription>
                {toRemove !== undefined && shortAddress(toRemove)} dejará de poder hacer lo que este rol permite. Puedes
                volver a asignárselo cuando quieras.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={removing} onClick={() => setToRemove(undefined)}>
                Cancelar
              </Button>
              <Button variant="destructive" disabled={removing} onClick={remove}>
                {removing ? <Loader className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
                Quitar rol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};
