"use client";

import { useState } from "react";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~~/components/ui/shadcn/dialog";
import { Input } from "~~/components/ui/shadcn/input";
import { Textarea } from "~~/components/ui/shadcn/textarea";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import {
  TASK_LINK_MAX_LENGTH,
  TASK_TEXT_MAX_LENGTH,
  TaskRejectionSchema,
  TaskSubmissionSchema,
} from "~~/lib/schemes/task.scheme";
import { TASK_STATUS, type TaskData } from "~~/lib/tasks";
import { shortAddress } from "~~/lib/utils";

type Confirmation = {
  /** Shows the confirm button in red: the action cannot be undone and nobody gets paid */
  destructive?: boolean;
  title: string;
  description: string;
  label: string;
  run: () => Promise<void>;
};

const Info: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="m-0 text-sm text-muted-foreground">{children}</p>
);

/**
 * What the connected user can do with a task right now. Every rule mirrors AgoraTasks.sol (the contract is the one
 * that enforces them); this only avoids offering buttons that would fail.
 */
export const TaskActions: React.FC<{ task: TaskData; tasksAddress: string }> = ({ task, tasksAddress }) => {
  const { address } = useAccount();
  const { isMember, canArbitrate } = useDaoRoles();

  //states
  const [pending, setPending] = useState<string>();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [link, setLink] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [formError, setFormError] = useState<string>();

  //Smart contract
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgoraTasks",
    contractAddress: tasksAddress,
  });

  //consts
  const me = address?.toLowerCase();
  const isCreator = me !== undefined && me === task.creator.toLowerCase();
  const isAssignee = me !== undefined && me === task.assignee.toLowerCase();
  const isExpired = Number(task.deadline) * 1000 < Date.now();
  const reward = `${formatEther(task.reward)} ETH`;
  const workDays = Number(task.workWindow / 86400n);
  const busy = pending !== undefined;

  //functions
  // Wallet errors are already shown by the transaction notifications
  const perform = async (name: string, action: () => Promise<unknown>, success: string) => {
    setPending(name);
    try {
      await action();
      toast.success(success);
    } catch (err) {
      console.error(err);
    } finally {
      setPending(undefined);
    }
  };

  const confirmAndRun = async () => {
    const current = confirmation;
    setConfirmation(undefined);
    await current?.run();
  };

  const take = () =>
    perform(
      "take",
      () => writeContractAsync({ functionName: "takeTask", args: [task.id] }),
      "Tarea tomada. ¡A trabajar!",
    );

  const abandon = () =>
    perform(
      "abandon",
      () => writeContractAsync({ functionName: "abandonTask", args: [task.id] }),
      "Dejaste la tarea. Vuelve a estar abierta.",
    );

  const submitWork = async () => {
    const result = TaskSubmissionSchema.safeParse({ link, note });
    if (!result.success) return setFormError(result.error.issues[0].message);

    setFormError(undefined);
    await perform(
      "submit",
      () => writeContractAsync({ functionName: "submitWork", args: [task.id, result.data.link, result.data.note] }),
      "Trabajo entregado. Ahora el creador lo revisa.",
    );
    setLink("");
    setNote("");
  };

  const requestChanges = async () => {
    const result = TaskRejectionSchema.safeParse({ reason });
    if (!result.success) return setFormError(result.error.issues[0].message);

    setFormError(undefined);
    await perform(
      "reject",
      () => writeContractAsync({ functionName: "rejectWork", args: [task.id, result.data.reason] }),
      "Cambios solicitados.",
    );
    setReason("");
  };

  const dispute = () =>
    perform(
      "dispute",
      () => writeContractAsync({ functionName: "disputeRejection", args: [task.id] }),
      "Disputa abierta. Un auditor decidirá.",
    );

  const unassign = () =>
    perform(
      "unassign",
      () => writeContractAsync({ functionName: "unassignTask", args: [task.id] }),
      "Tarea reabierta para otros miembros.",
    );

  // actions that move money: they ask for confirmation first
  const askToApprove = () =>
    setConfirmation({
      title: "¿Aprobar el trabajo y pagar?",
      description: `Se enviarán ${reward} a ${shortAddress(task.assignee)}. Esta acción no se puede deshacer.`,
      label: "Aprobar y pagar",
      run: () =>
        perform(
          "approve",
          () => writeContractAsync({ functionName: "approveWork", args: [task.id] }),
          "Trabajo aprobado y pagado.",
        ),
    });

  const askToClaim = () =>
    setConfirmation({
      title: "¿Cobrar la recompensa?",
      description: `El creador no respondió a tiempo, así que se enviarán ${reward} a ${shortAddress(task.assignee)}.`,
      label: "Cobrar",
      run: () =>
        perform(
          "claim",
          () => writeContractAsync({ functionName: "claimPayment", args: [task.id] }),
          "Recompensa enviada.",
        ),
    });

  const askToCancel = () =>
    setConfirmation({
      destructive: true,
      title: "¿Cancelar la tarea?",
      description: `Se te devolverán ${reward}. La tarea dejará de estar disponible.`,
      label: "Cancelar tarea",
      run: () =>
        perform(
          "cancel",
          () => writeContractAsync({ functionName: "cancelTask", args: [task.id] }),
          "Tarea cancelada. Recompensa devuelta.",
        ),
    });

  const askToRefund = () =>
    setConfirmation({
      title: "¿Devolver la recompensa al creador?",
      description: `Nadie tomó la tarea a tiempo, así que se devolverán ${reward} a ${shortAddress(task.creator)}.`,
      label: "Devolver recompensa",
      run: () =>
        perform(
          "refund",
          () => writeContractAsync({ functionName: "refundExpired", args: [task.id] }),
          "Recompensa devuelta al creador.",
        ),
    });

  const askToResolve = (payAssignee: boolean) =>
    setConfirmation({
      title: payAssignee ? "¿Pagar a quien trabajó?" : "¿Devolver el dinero al creador?",
      description: payAssignee
        ? `Se enviarán ${reward} a ${shortAddress(task.assignee)}. Tu decisión es definitiva.`
        : `Se devolverán ${reward} a ${shortAddress(task.creator)}. Tu decisión es definitiva.`,
      label: payAssignee ? "Pagar a quien trabajó" : "Devolver al creador",
      run: () =>
        perform(
          "resolve",
          () => writeContractAsync({ functionName: "resolveDispute", args: [task.id, payAssignee] }),
          "Disputa resuelta.",
        ),
    });

  const spinner = (name: string) => pending === name && <Loader className="size-4 animate-spin" />;

  // the form to send (or send again) the work
  const submitForm = (
    <div className="space-y-2">
      <Input
        placeholder="Enlace a tu trabajo (Figma, GitHub, Drive...)"
        value={link}
        maxLength={TASK_LINK_MAX_LENGTH}
        onChange={event => setLink(event.target.value)}
      />
      <Textarea
        placeholder="Una nota para el creador (opcional)"
        className="h-20 resize-none"
        value={note}
        maxLength={TASK_TEXT_MAX_LENGTH}
        onChange={event => setNote(event.target.value)}
      />
      <Button className="w-full" disabled={busy} onClick={submitWork}>
        {spinner("submit")}
        Entregar trabajo
      </Button>
    </div>
  );

  const content = (() => {
    if (address === undefined) return <Info>Conecta tu wallet para participar en esta tarea.</Info>;

    switch (task.status) {
      case TASK_STATUS.Open:
        if (isExpired) {
          return (
            <>
              <Info>Nadie la tomó a tiempo. La recompensa puede volver al creador.</Info>
              <Button className="w-full" variant="outline" disabled={busy} onClick={askToRefund}>
                {spinner("refund")}
                Devolver la recompensa al creador
              </Button>
            </>
          );
        }
        return (
          <>
            {isCreator ? (
              <>
                <Info>Esperando que un miembro la tome.</Info>
                <Button className="w-full" variant="destructive" disabled={busy} onClick={askToCancel}>
                  {spinner("cancel")}
                  Cancelar tarea
                </Button>
              </>
            ) : isMember ? (
              <>
                <Info>Si la tomas, tendrás {workDays} días para entregar el trabajo.</Info>
                <Button className="w-full" disabled={busy} onClick={take}>
                  {spinner("take")}
                  Tomar esta tarea
                </Button>
              </>
            ) : (
              <Info>Solo los miembros de la DAO pueden tomar tareas.</Info>
            )}
          </>
        );

      case TASK_STATUS.Taken:
      case TASK_STATUS.Rejected:
        if (isAssignee) {
          return (
            <>
              {task.status === TASK_STATUS.Rejected && (
                <div className="space-y-1 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
                  <p className="m-0 text-sm font-medium">El creador pidió cambios</p>
                  <p className="m-0 text-sm [overflow-wrap:anywhere]">{task.rejectionReason}</p>
                </div>
              )}
              {submitForm}
              {task.status === TASK_STATUS.Rejected && (
                <Button className="w-full" variant="outline" disabled={busy} onClick={dispute}>
                  {spinner("dispute")}
                  No estoy de acuerdo: abrir disputa
                </Button>
              )}
              <Button className="w-full" variant="ghost" disabled={busy} onClick={abandon}>
                {spinner("abandon")}
                Abandonar la tarea
              </Button>
            </>
          );
        }
        if (isCreator && isExpired) {
          return (
            <>
              <Info>Quien la tiene no entregó a tiempo. Puedes quitársela para que otro la tome.</Info>
              <Button className="w-full" variant="outline" disabled={busy} onClick={unassign}>
                {spinner("unassign")}
                Quitar la tarea
              </Button>
            </>
          );
        }
        return (
          <Info>
            {task.status === TASK_STATUS.Taken
              ? `${shortAddress(task.assignee)} está trabajando en ella.`
              : "El creador pidió cambios y se está esperando la corrección."}
          </Info>
        );

      case TASK_STATUS.Submitted:
        return (
          <>
            {isCreator && (
              <>
                <Info>
                  {isExpired
                    ? "Pasó el plazo de revisión: ya no puedes pedir cambios, pero sí aprobar."
                    : "Revisa el trabajo entregado y decide."}
                </Info>
                <Button className="w-full" disabled={busy} onClick={askToApprove}>
                  {spinner("approve")}
                  Aprobar y pagar
                </Button>
                {!isExpired && (
                  <div className="space-y-2 border-t pt-3">
                    <Textarea
                      placeholder="¿Qué hay que cambiar?"
                      className="h-20 resize-none"
                      value={reason}
                      maxLength={TASK_TEXT_MAX_LENGTH}
                      onChange={event => setReason(event.target.value)}
                    />
                    <Button className="w-full" variant="outline" disabled={busy} onClick={requestChanges}>
                      {spinner("reject")}
                      Pedir cambios
                    </Button>
                  </div>
                )}
              </>
            )}
            {!isCreator && !isExpired && <Info>El trabajo está en revisión por el creador.</Info>}
            {!isCreator && isExpired && (
              <>
                <Info>El creador no respondió a tiempo: la recompensa ya se puede cobrar.</Info>
                <Button className="w-full" disabled={busy} onClick={askToClaim}>
                  {spinner("claim")}
                  Cobrar la recompensa
                </Button>
              </>
            )}
          </>
        );

      case TASK_STATUS.Disputed:
        if (canArbitrate && !isCreator && !isAssignee) {
          return (
            <>
              <Info>
                Decide con los criterios de aceptación y el motivo del rechazo a la vista. Tu decisión es definitiva.
              </Info>
              <Button className="w-full" disabled={busy} onClick={() => askToResolve(true)}>
                {spinner("resolve")}
                Pagar a quien trabajó
              </Button>
              <Button className="w-full" variant="outline" disabled={busy} onClick={() => askToResolve(false)}>
                Devolver el dinero al creador
              </Button>
            </>
          );
        }
        return <Info>En disputa: un auditor o administrador ajeno a la tarea debe decidir.</Info>;

      case TASK_STATUS.Completed:
        return <Info>Tarea completada: la recompensa se pagó a {shortAddress(task.assignee)}.</Info>;

      default:
        return <Info>Tarea cancelada: la recompensa volvió al creador.</Info>;
    }
  })();

  return (
    <>
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Qué puedes hacer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {content}
          {formError !== undefined && <p className="m-0 text-sm text-destructive">{formError}</p>}
        </CardContent>
      </Card>

      <Dialog open={confirmation !== undefined} onOpenChange={open => !open && setConfirmation(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmation?.title}</DialogTitle>
            <DialogDescription className="text-foreground/80">{confirmation?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmation(undefined)}>
              Volver
            </Button>
            <Button variant={confirmation?.destructive ? "destructive" : "default"} onClick={confirmAndRun}>
              {confirmation?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
