"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, History, Search } from "lucide-react";
import { formatEther } from "viem";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/shadcn/badge";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";
import { ScrollArea } from "~~/components/ui/shadcn/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~~/components/ui/shadcn/sheet";
import { Tabs, TabsList, TabsTrigger } from "~~/components/ui/shadcn/tabs";
import { formatRelativeTime, shortAddress } from "~~/lib/utils";
import { cn } from "~~/lib/utils";

export type Movement = {
  key: string;
  kind: "deposit" | "payout";
  party: string;
  amount: bigint;
  timestamp: number;
  proposalId?: bigint;
  order: number;
};

type MovementsSheetProps = {
  movements: Movement[];
  trigger?: React.ReactNode;
};

export const MovementsSheet: React.FC<MovementsSheetProps> = ({ movements, trigger }) => {
  //states
  const [search, setSearch] = useState<string>("");
  const [kind, setKind] = useState<"all" | "deposit" | "payout">("all");

  //memos
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();

    return movements
      .filter(m => kind === "all" || m.kind === kind)
      .filter(m => text.length === 0 || m.party.toLowerCase().includes(text));
  }, [movements, search, kind]);

  const total = movements.length;
  const matching = filtered.length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4" />
            Ver todos
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <SheetTitle>Movimientos de la tesorería</SheetTitle>
          <SheetDescription>Todo lo que entra y sale, en el orden en que pasó.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por dirección (0x...)"
              className="pl-10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Tabs value={kind} onValueChange={value => setKind(value as typeof kind)}>
              <TabsList>
                <TabsTrigger value="all">Todos</TabsTrigger>
                <TabsTrigger value="deposit">Donaciones</TabsTrigger>
                <TabsTrigger value="payout">Pagos</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              {matching === total ? `${total} movimientos` : `${matching} de ${total}`}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <p className="m-0 py-16 text-center text-sm text-muted-foreground">Ningún movimiento coincide.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-4">
              {filtered.map(m => (
                <li key={m.key} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                  <div
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      m.kind === "deposit"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                    )}
                  >
                    {m.kind === "deposit" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* div, not p: Address renders a div inside and the browser bails if we nest */}
                    <div className="flex items-center gap-2 text-sm">
                      {m.kind === "deposit" ? "Donó" : "Pagó a"} <Address address={m.party} />
                    </div>
                    <p className="m-0 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {m.proposalId !== undefined && (
                        <Link href={`/vote/${m.proposalId}`} className="text-primary underline underline-offset-2">
                          Propuesta #{m.proposalId.toString()}
                        </Link>
                      )}
                      {m.timestamp > 0 && <span>{formatRelativeTime(m.timestamp)}</span>}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "shrink-0 font-semibold",
                      m.kind === "deposit"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-rose-700 dark:text-rose-400",
                    )}
                  >
                    {m.kind === "deposit" ? "+" : "−"}
                    {formatEther(m.amount)} ETH
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

/** Compact movement row used in the preview on the Treasury page. */
export const MovementRow: React.FC<{ movement: Movement }> = ({ movement: m }) => (
  <li className="flex items-center gap-3 rounded-lg border bg-card p-3">
    <div
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full",
        m.kind === "deposit"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      )}
    >
      {m.kind === "deposit" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
    </div>
    <div className="min-w-0 flex-1 space-y-0.5">
      <p className="m-0 flex items-center gap-2 text-sm">
        {m.kind === "deposit" ? "Donó" : "Pagó a"} <span className="font-medium">{shortAddress(m.party)}</span>
      </p>
      <p className="m-0 text-xs text-muted-foreground">{m.timestamp > 0 && formatRelativeTime(m.timestamp)}</p>
    </div>
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 font-semibold",
        m.kind === "deposit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400",
      )}
    >
      {m.kind === "deposit" ? "+" : "−"}
      {formatEther(m.amount)} ETH
    </Badge>
  </li>
);
