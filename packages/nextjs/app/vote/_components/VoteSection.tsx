"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ProposalCard } from "./ProposalCard";
import { Plus, Search, Vote } from "lucide-react";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useVotesAddress } from "~~/hooks/useVotesAddress";
import { PROPOSAL_STATUS, type ProposalData } from "~~/lib/votes";

// Which statuses each tab shows
const TABS: Record<string, readonly number[] | undefined> = {
  all: undefined,
  active: [PROPOSAL_STATUS.Active],
  closed: [PROPOSAL_STATUS.Approved, PROPOSAL_STATUS.Rejected, PROPOSAL_STATUS.QuorumNotReached],
};

export const VoteSection: React.FC = () => {
  const votesAddress = useVotesAddress();
  const { canCreateProposals } = useDaoRoles();

  //states
  const [search, setSearch] = useState<string>("");
  const [tab, setTab] = useState<string>("all");

  //smart contract
  const { data: proposals, isLoading } = useScaffoldReadContract({
    contractName: "AgoraVotes",
    functionName: "getAllProposals",
    contractAddress: votesAddress,
    query: { enabled: votesAddress !== undefined },
  });

  //memos
  const proposalsFiltered = useMemo(() => {
    const text = search.trim().toLowerCase();
    const statuses = TABS[tab];

    // newest first
    return [...((proposals ?? []) as readonly ProposalData[])]
      .reverse()
      .filter(proposal => statuses === undefined || statuses.includes(proposal.status))
      .filter(proposal => text.length === 0 || proposal.title.toLowerCase().includes(text));
  }, [proposals, search, tab]);

  const hasProposals = (proposals?.length ?? 0) > 0;

  return (
    <main className="container mx-auto space-y-6 px-4 py-2">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Propuestas de la DAO</h1>
          <p className="text-muted-foreground">Lee, debate y vota lo que decide la comunidad.</p>
        </div>
        {canCreateProposals ? (
          <Button asChild className="w-full md:w-auto">
            <Link href="/vote/new">
              <Plus className="h-4 w-4" /> Nueva propuesta
            </Link>
          </Button>
        ) : (
          <p className="m-0 max-w-xs text-xs text-muted-foreground md:text-right">
            Solo los gestores de propuestas y los administradores publican propuestas.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar propuestas..."
            className="pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Tabs value={tab} onValueChange={setTab} className="w-full lg:w-auto">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="active">En votación</TabsTrigger>
            <TabsTrigger value="closed">Cerradas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {votesAddress === undefined || isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map(x => (
            <Skeleton key={x} className="h-52" />
          ))}
        </div>
      ) : proposalsFiltered.length === 0 ? (
        <article className="flex flex-col items-center gap-3 py-16 text-center">
          <Vote className="h-16 w-16 text-muted-foreground" />
          <h3 className="m-0 text-xl font-semibold">
            {hasProposals ? "Ninguna propuesta coincide" : "Aún no hay propuestas"}
          </h3>
          <p className="m-0 max-w-sm text-muted-foreground">
            {hasProposals
              ? "Prueba con otra búsqueda o cambia la pestaña."
              : canCreateProposals
                ? "Publica la primera propuesta de tu DAO."
                : "Cuando un gestor de propuestas publique una, aparecerá aquí."}
          </p>
          {!hasProposals && canCreateProposals && (
            <Button asChild>
              <Link href="/vote/new">
                <Plus className="h-4 w-4" /> Nueva propuesta
              </Link>
            </Button>
          )}
        </article>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {proposalsFiltered.map(proposal => (
            <ProposalCard
              key={proposal.id.toString()}
              proposal={proposal as ProposalData}
              href={`/vote/${proposal.id}`}
            />
          ))}
        </div>
      )}
    </main>
  );
};
