"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { TaskActions } from "./TaskActions";
import { ArrowLeft, Check, CircleCheck, ExternalLink, FileSearch, RefreshCw, Users } from "lucide-react";
import { formatEther } from "viem";
import { Markdown } from "~~/components/Markdown";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { TASK_CATEGORIES } from "~~/constants/taskCategories";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useTaskMetadata } from "~~/hooks/useTaskMetadata";
import { useTasksAddress } from "~~/hooks/useTasksAddress";
import { getCategoryStyle } from "~~/lib/categoryColors";
import { isHttpUrl } from "~~/lib/schemes/task.scheme";
import { getTaskImageUrl } from "~~/lib/storage";
import { TASK_STATUS, TASK_STATUS_META, getDeadlineText } from "~~/lib/tasks";
import { cn } from "~~/lib/utils";

// The happy path of a task, to show how far it is. Rejected and disputed tasks stay on their step.
const FLOW = ["Publicada", "Tomada", "Entregada", "Pagada"];
const FLOW_STEP: Record<number, number> = {
  [TASK_STATUS.Open]: 0,
  [TASK_STATUS.Taken]: 1,
  [TASK_STATUS.Rejected]: 1,
  [TASK_STATUS.Submitted]: 2,
  [TASK_STATUS.Disputed]: 2,
  [TASK_STATUS.Completed]: 3,
};

const ExternalLinkItem: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-primary underline underline-offset-2 [overflow-wrap:anywhere]"
  >
    {children}
    <ExternalLink className="size-3.5 shrink-0" />
  </a>
);

export const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const tasksAddress = useTasksAddress();

  const isValidId = /^\d+$/.test(id);

  //smart contract
  const {
    data: task,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "AgoraTasks",
    functionName: "getTask",
    args: [isValidId ? BigInt(id) : undefined],
    contractAddress: tasksAddress,
    query: { enabled: tasksAddress !== undefined && isValidId },
  });

  const details = useTaskMetadata(task?.metadataHash);

  if (!isValidId || (error !== null && error !== undefined)) {
    return (
      <main className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-center">
        <FileSearch className="h-16 w-16 text-muted-foreground" />
        <h1 className="m-0 text-2xl font-bold">No encontramos esta tarea</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Puede que el enlace sea incorrecto o que la tarea no exista.
        </p>
        <Button asChild>
          <Link href="/task">Volver a las tareas</Link>
        </Button>
      </main>
    );
  }

  if (isLoading || task === undefined || tasksAddress === undefined) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  const statusMeta = TASK_STATUS_META[task.status];
  const categoryId = Number(task.categoryId);
  const category = TASK_CATEGORIES[categoryId];
  const deadlineText = getDeadlineText(task.status, task.deadline);
  const hasAssignee = task.assignee !== "0x0000000000000000000000000000000000000000";
  const currentStep = FLOW_STEP[task.status];
  const hasSubmission = task.submissionURI.length > 0;

  return (
    <main className="container mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="space-y-3">
        <Link
          href="/task"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a las tareas
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {category !== undefined && (
            <Badge variant="outline" className={getCategoryStyle(categoryId).soft}>
              {category.toLowerCase()}
            </Badge>
          )}
          <Badge className={cn("border-transparent", statusMeta?.className)}>{statusMeta?.label}</Badge>
          <Badge variant="secondary">#{task.id.toString()}</Badge>
        </div>
        <h1 className="m-0 text-3xl font-bold tracking-tight [overflow-wrap:anywhere]">{task.title}</h1>
        <p className="m-0 text-lg text-muted-foreground [overflow-wrap:anywhere]">{task.summary}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la tarea</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {details.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-5 w-2/3" />
                </div>
              ) : details.isError || details.data === undefined ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="m-0 text-sm text-muted-foreground">
                    {details.error instanceof Error ? details.error.message : "No se pudieron cargar los detalles."} A
                    veces el servicio donde se guardan tarda o limita las lecturas.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => details.refetch()}>
                    <RefreshCw className="size-4" />
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <Markdown>{details.data.description}</Markdown>

                  {details.data.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {details.data.images.map(image => (
                        <a
                          key={image}
                          href={getTaskImageUrl(image)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-video overflow-hidden rounded-lg border"
                        >
                          {
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getTaskImageUrl(image)}
                              alt="Imagen de la tarea"
                              className="size-full object-cover"
                            />
                          }
                        </a>
                      ))}
                    </div>
                  )}

                  {details.data.criteria.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="m-0 text-base font-semibold">Criterios de aceptación</h2>
                      <ul className="m-0 list-none space-y-1.5 p-0">
                        {details.data.criteria.map((criterion, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span className="[overflow-wrap:anywhere]">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {details.data.links.length > 0 && (
                    <div className="space-y-2">
                      <h2 className="m-0 text-base font-semibold">Enlaces de referencia</h2>
                      <ul className="m-0 list-none space-y-1.5 p-0 text-sm">
                        {details.data.links.map((reference, index) => (
                          <li key={index}>
                            <ExternalLinkItem href={reference.url}>{reference.label || reference.url}</ExternalLinkItem>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {hasSubmission && (
            <Card>
              <CardHeader>
                <CardTitle>Trabajo entregado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {/* Anyone can send a link straight to the contract, so only web addresses become links */}
                {isHttpUrl(task.submissionURI) ? (
                  <ExternalLinkItem href={task.submissionURI}>{task.submissionURI}</ExternalLinkItem>
                ) : (
                  <p className="m-0 [overflow-wrap:anywhere]">{task.submissionURI}</p>
                )}
                {task.submissionNote.length > 0 && (
                  <p className="m-0 text-muted-foreground [overflow-wrap:anywhere]">{task.submissionNote}</p>
                )}
                {task.rejectionReason.length > 0 && (
                  <div className="space-y-1 rounded-lg border border-orange-500/40 bg-orange-500/10 p-3">
                    <p className="m-0 font-medium">Cambios pedidos por el creador</p>
                    <p className="m-0 [overflow-wrap:anywhere]">{task.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side: reward, progress, people and actions */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="gap-2 py-5">
            <CardContent className="space-y-1">
              <p className="m-0 text-sm text-muted-foreground">Recompensa</p>
              <p className="m-0 text-3xl font-bold">{formatEther(task.reward)} ETH</p>
              {deadlineText !== undefined && <p className="m-0 text-sm text-muted-foreground">{deadlineText}</p>}
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardContent>
              {task.status === TASK_STATUS.Cancelled ? (
                <p className="m-0 text-sm text-muted-foreground">
                  Esta tarea se canceló y la recompensa volvió al creador.
                </p>
              ) : (
                <ol className="m-0 list-none space-y-3 p-0">
                  {FLOW.map((label, index) => {
                    const isDone = index < currentStep || task.status === TASK_STATUS.Completed;
                    const isCurrent = index === currentStep && task.status !== TASK_STATUS.Completed;

                    return (
                      <li key={label} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                            isDone && "border-primary bg-primary text-primary-foreground",
                            isCurrent && "border-primary text-primary",
                            !isDone && !isCurrent && "border-border text-muted-foreground",
                          )}
                        >
                          {isDone ? <Check className="size-3.5" /> : index + 1}
                        </span>
                        <span className={cn("text-sm", isCurrent ? "font-medium" : !isDone && "text-muted-foreground")}>
                          {label}
                          {isCurrent && index > 0 && index < 3 && statusMeta && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({statusMeta.label.toLowerCase()})
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>

          <Card className="gap-3 py-5">
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Creador
                </p>
                <Address address={task.creator} />
              </div>
              <div className="space-y-1">
                <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Users className="size-3.5" />
                  Quién la tiene
                </p>
                {hasAssignee ? (
                  <Address address={task.assignee} />
                ) : (
                  <span className="text-muted-foreground">Nadie todavía</span>
                )}
              </div>
            </CardContent>
          </Card>

          <TaskActions task={task} tasksAddress={tasksAddress} />
        </aside>
      </div>
    </main>
  );
};
