"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { VoteBar } from "../../_components/VoteBar";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  FileSearch,
  Hammer,
  Loader,
  Play,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Markdown } from "~~/components/Markdown";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useVotesAddress } from "~~/hooks/useVotesAddress";
import { cn } from "~~/lib/utils";
import {
  ACTION_KIND,
  CHOICE_META,
  PROPOSAL_STATUS,
  PROPOSAL_STATUS_META,
  type ProposalData,
  VOTE_CHOICE,
  getVotingDeadlineText,
  summarizeProposal,
} from "~~/lib/votes";

const CHOICE_BUTTONS = [
  {
    choice: VOTE_CHOICE.For,
    label: "A favor",
    Icon: CheckCircle2,
    hover: "hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400",
  },
  {
    choice: VOTE_CHOICE.Against,
    label: "En contra",
    Icon: XCircle,
    hover: "hover:border-rose-500 hover:text-rose-600 dark:hover:border-rose-500 dark:hover:text-rose-400",
  },
  {
    choice: VOTE_CHOICE.Abstain,
    label: "Abstenerme",
    Icon: Clock,
    hover: "hover:border-slate-500 hover:text-slate-600 dark:hover:border-slate-400 dark:hover:text-slate-300",
  },
] as const;

export const ProposalDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const votesAddress = useVotesAddress();
  const { canVote } = useDaoRoles();

  //states
  const [pending, setPending] = useState<string>();

  const isValidId = /^\d+$/.test(id);

  //smart contract
  const {
    data: proposal,
    isLoading,
    error,
  } = useScaffoldReadContract({
    contractName: "AgoraVotes",
    functionName: "getProposal",
    args: [isValidId ? BigInt(id) : undefined],
    contractAddress: votesAddress,
    query: { enabled: votesAddress !== undefined && isValidId },
  });

  const { data: myVote } = useScaffoldReadContract({
    contractName: "AgoraVotes",
    functionName: "getVote",
    args: [isValidId ? BigInt(id) : undefined, address],
    contractAddress: votesAddress,
    query: { enabled: votesAddress !== undefined && isValidId && address !== undefined },
  });

  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgoraVotes",
    contractAddress: votesAddress,
  });

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

  const vote = (choice: number) =>
    perform(
      `vote-${choice}`,
      () => writeContractAsync({ functionName: "castVote", args: [BigInt(id), choice] }),
      "¡Voto registrado!",
    );

  const finalize = () =>
    perform(
      "finalize",
      () => writeContractAsync({ functionName: "finalize", args: [BigInt(id)] }),
      "Votación cerrada.",
    );

  const execute = () =>
    perform(
      "execute",
      () => writeContractAsync({ functionName: "execute", args: [BigInt(id)] }),
      "¡Propuesta ejecutada!",
    );

  const spinner = (name: string) => pending === name && <Loader className="size-4 animate-spin" />;

  if (!isValidId || (error !== null && error !== undefined)) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
        <FileSearch className="h-16 w-16 text-muted-foreground" />
        <h1 className="m-0 text-2xl font-bold">No encontramos esta propuesta</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Puede que el enlace sea incorrecto o que la propuesta no exista.
        </p>
        <Button asChild>
          <Link href="/vote">Volver a las propuestas</Link>
        </Button>
      </main>
    );
  }

  if (isLoading || proposal === undefined || votesAddress === undefined) {
    return (
      <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </main>
    );
  }

  const p = proposal as ProposalData;
  const statusMeta = PROPOSAL_STATUS_META[p.status];
  const summary = summarizeProposal(p);
  const deadlineText = getVotingDeadlineText(p.status, p.votingDeadline);
  const isActive = p.status === PROPOSAL_STATUS.Active;
  const isExpired = Number(p.votingDeadline) * 1000 < Date.now();
  const [hasVoted, myChoice] = (myVote ?? [false, 0]) as readonly [boolean, number];
  const isPayout = p.action.kind === ACTION_KIND.PayETH;
  const busy = pending !== undefined;

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="space-y-3">
        <Link
          href="/vote"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a las propuestas
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">#{p.id.toString()}</Badge>
          <Badge className={cn("border-transparent", statusMeta?.className)}>{statusMeta?.label}</Badge>
        </div>
        <h1 className="m-0 text-3xl font-bold tracking-tight [overflow-wrap:anywhere]">{p.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Propuesta por <Address address={p.creator} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>La propuesta</CardTitle>
            </CardHeader>
            <CardContent>
              <Markdown>{p.description}</Markdown>
            </CardContent>
          </Card>

          {isPayout && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="size-5" />
                  Si se aprueba, paga desde la tesorería
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-muted-foreground">Destinatario</span>
                  <Address address={p.action.target} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Monto</span>
                  <span className="font-semibold">{formatEther(p.action.value)} ETH</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side: results and voting */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="gap-3 py-5">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Resultados</CardTitle>
              {deadlineText !== undefined && (
                <CardDescription className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {deadlineText}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <VoteBar
                forPercent={summary.forPercent}
                againstPercent={summary.againstPercent}
                abstainPercent={summary.abstainPercent}
              />
              <ul className="m-0 list-none space-y-2 p-0 text-sm">
                {[
                  { label: "A favor", votes: p.forVotes, color: "bg-emerald-500 dark:bg-emerald-600" },
                  { label: "En contra", votes: p.againstVotes, color: "bg-rose-500 dark:bg-rose-600" },
                  { label: "Abstención", votes: p.abstainVotes, color: "bg-slate-400 dark:bg-slate-500" },
                ].map(({ label, votes, color }) => (
                  <li key={label} className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={cn("size-2.5 rounded-full", color)} />
                      {label}
                    </span>
                    <span className="font-medium">{votes.toString()}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-1 border-t pt-3 text-xs text-muted-foreground">
                <p className="m-0 flex items-center gap-1">
                  <Users className="size-3.5" />
                  {summary.totalVotes} de {summary.totalMembers} miembros votaron
                </p>
                <p
                  className={cn(
                    "m-0 flex items-center gap-1",
                    summary.quorumMet && isActive && "text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  <Check className="size-3.5" />
                  Quorum: {summary.totalVotes}/{summary.quorumVotes} {summary.quorumMet ? "✓" : "pendiente"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Qué puedes hacer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isActive && !isExpired && hasVoted && (
                <>
                  <p className="m-0 text-sm text-muted-foreground">Tu voto quedó registrado:</p>
                  <Badge className={cn("border-transparent", CHOICE_META[myChoice]?.className)}>
                    {CHOICE_META[myChoice]?.label}
                  </Badge>
                </>
              )}

              {isActive && !isExpired && !hasVoted && address === undefined && (
                <p className="m-0 text-sm text-muted-foreground">Conecta tu wallet para votar.</p>
              )}

              {isActive && !isExpired && !hasVoted && address !== undefined && !canVote && (
                <p className="m-0 text-sm text-muted-foreground">Solo los miembros de la DAO pueden votar.</p>
              )}

              {isActive && !isExpired && !hasVoted && canVote && (
                <div className="grid gap-2">
                  {CHOICE_BUTTONS.map(({ choice, label, Icon, hover }) => (
                    <Button
                      key={choice}
                      variant="outline"
                      disabled={busy}
                      onClick={() => vote(choice)}
                      className={cn("justify-start transition-colors", hover)}
                    >
                      {spinner(`vote-${choice}`) || <Icon className="size-4" />}
                      {label}
                    </Button>
                  ))}
                </div>
              )}

              {isActive && isExpired && (
                <>
                  <p className="m-0 text-sm text-muted-foreground">
                    La votación terminó. Cualquiera puede cerrarla para publicar el resultado.
                  </p>
                  <Button className="w-full" disabled={busy} onClick={finalize}>
                    {spinner("finalize") || <Hammer className="size-4" />}
                    Cerrar la votación
                  </Button>
                </>
              )}

              {p.status === PROPOSAL_STATUS.Approved && isPayout && (
                <>
                  <p className="m-0 text-sm text-muted-foreground">
                    Aprobada. Ejecuta la propuesta para que la tesorería envíe {formatEther(p.action.value)} ETH.
                  </p>
                  <Button className="w-full" disabled={busy} onClick={execute}>
                    {spinner("execute") || <Play className="size-4" />}
                    Ejecutar el pago
                  </Button>
                </>
              )}

              {p.status === PROPOSAL_STATUS.Approved && !isPayout && (
                <p className="m-0 text-sm text-muted-foreground">La propuesta fue aprobada.</p>
              )}

              {p.status === PROPOSAL_STATUS.Rejected && (
                <p className="m-0 text-sm text-muted-foreground">La propuesta no fue aprobada.</p>
              )}

              {p.status === PROPOSAL_STATUS.QuorumNotReached && (
                <p className="m-0 text-sm text-muted-foreground">
                  No participó suficiente gente para que la votación contara.
                </p>
              )}

              {p.status === PROPOSAL_STATUS.Executed && (
                <p className="m-0 text-sm text-muted-foreground">
                  {isPayout
                    ? `La tesorería envió ${formatEther(p.action.value)} ETH a quien decidió la propuesta.`
                    : "La propuesta fue ejecutada."}
                </p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};
