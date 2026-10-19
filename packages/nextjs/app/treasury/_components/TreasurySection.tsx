"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type Movement, MovementRow, MovementsSheet } from "./MovementsSheet";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Info,
  Landmark,
  Loader,
  Plus,
  Users,
  Vote,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Input } from "~~/components/ui/shadcn/input";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useTreasuryAddress } from "~~/hooks/useTreasuryAddress";
import { cn, getEventTimestamp, shortAddress } from "~~/lib/utils";

const RECENT_MOVEMENTS = 5;

export const TreasurySection: React.FC = () => {
  const { address } = useAccount();
  const { data: userBalance } = useBalance({ address });
  const treasuryAddress = useTreasuryAddress();
  const { canCreateProposals } = useDaoRoles();

  //states
  const [amount, setAmount] = useState<string>("");

  //smart contract
  const { data: balance, isLoading: balanceLoading } = useScaffoldReadContract({
    contractName: "AgoraTreasury",
    functionName: "balance",
    contractAddress: treasuryAddress,
    query: { enabled: treasuryAddress !== undefined },
  });
  const { data: totalDeposited } = useScaffoldReadContract({
    contractName: "AgoraTreasury",
    functionName: "totalDeposited",
    contractAddress: treasuryAddress,
    query: { enabled: treasuryAddress !== undefined },
  });
  const { data: totalPaid } = useScaffoldReadContract({
    contractName: "AgoraTreasury",
    functionName: "totalPaid",
    contractAddress: treasuryAddress,
    query: { enabled: treasuryAddress !== undefined },
  });

  const { data: deposits, isLoading: depositsLoading } = useScaffoldEventHistory({
    contractName: "AgoraTreasury",
    eventName: "Deposited",
    contractAddress: treasuryAddress,
    fromBlock: 0n,
    watch: true,
    blockData: true,
    enabled: treasuryAddress !== undefined,
  });
  const { data: payouts, isLoading: payoutsLoading } = useScaffoldEventHistory({
    contractName: "AgoraTreasury",
    eventName: "Paid",
    contractAddress: treasuryAddress,
    fromBlock: 0n,
    watch: true,
    blockData: true,
    enabled: treasuryAddress !== undefined,
  });

  //donation flow
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });
  const donating = isSending || isConfirming;

  //memos
  const movements = useMemo<Movement[]>(() => {
    const d: Movement[] = (deposits ?? []).map(x => ({
      key: `d-${x.transactionHash}-${x.logIndex}`,
      kind: "deposit",
      party: x.args.from as string,
      amount: x.args.amount as bigint,
      timestamp: getEventTimestamp(x),
      order: Number(x.blockNumber ?? 0n) * 1000 + Number(x.logIndex ?? 0),
    }));
    const p: Movement[] = (payouts ?? []).map(x => ({
      key: `p-${x.transactionHash}-${x.logIndex}`,
      kind: "payout",
      party: x.args.to as string,
      amount: x.args.amount as bigint,
      proposalId: x.args.proposalId as bigint,
      timestamp: getEventTimestamp(x),
      order: Number(x.blockNumber ?? 0n) * 1000 + Number(x.logIndex ?? 0),
    }));
    return [...d, ...p].sort((a, b) => b.order - a.order);
  }, [deposits, payouts]);

  /** Unique donor wallets. A wallet that donated 10 times still counts as 1. */
  const uniqueDonors = useMemo(() => {
    const addresses = new Set<string>();
    for (const d of deposits ?? []) addresses.add((d.args.from as string).toLowerCase());
    return addresses.size;
  }, [deposits]);

  //functions
  const parsedAmount = (() => {
    try {
      return parseEther(amount);
    } catch {
      return undefined;
    }
  })();
  const notEnoughBalance = userBalance !== undefined && parsedAmount !== undefined && parsedAmount > userBalance.value;
  const amountValid = parsedAmount !== undefined && parsedAmount > 0n && !notEnoughBalance;

  const donate = async () => {
    if (treasuryAddress === undefined || !amountValid) return;

    try {
      const hash = await sendTransactionAsync({ to: treasuryAddress as `0x${string}`, value: parsedAmount });
      setTxHash(hash);
      toast.success(`¡Donación enviada! ${formatEther(parsedAmount)} ETH`);
      setAmount("");
    } catch (err) {
      console.error(err);
      // wallet errors are already shown by the transaction notifications
    }
  };

  if (treasuryAddress === undefined) {
    return (
      <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map(x => (
            <Skeleton key={x} className="h-28" />
          ))}
        </div>
      </main>
    );
  }

  const stats = [
    {
      icon: Wallet,
      label: "Saldo actual",
      value: balance !== undefined ? `${formatEther(balance)} ETH` : undefined,
      hint: "Lo que la tesorería tiene disponible",
      prominent: true,
    },
    {
      icon: Users,
      label: "Donantes",
      value: `${uniqueDonors}`,
      hint: uniqueDonors === 1 ? "wallet distinta" : "wallets distintas",
    },
    {
      icon: ArrowDownLeft,
      label: "Recibido",
      value: totalDeposited !== undefined ? `${formatEther(totalDeposited)} ETH` : undefined,
      hint: "Total de donaciones",
    },
    {
      icon: ArrowUpRight,
      label: "Pagado",
      value: totalPaid !== undefined ? `${formatEther(totalPaid)} ETH` : undefined,
      hint: "Total de pagos aprobados",
    },
  ];

  const historyLoading = depositsLoading || payoutsLoading;
  const recentMovements = movements.slice(0, RECENT_MOVEMENTS);

  return (
    <main className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="m-0 flex items-center gap-2 text-3xl font-bold tracking-tight">
            <Landmark className="size-7" />
            Tesorería
          </h1>
          <p className="m-0 text-muted-foreground">
            Los fondos de la DAO. Solo salen cuando una propuesta aprobada los libera.
          </p>
        </div>
        {canCreateProposals && (
          <Button asChild variant="outline">
            <Link href="/vote/new">
              <Vote className="h-4 w-4" />
              Proponer un pago
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ icon: Icon, label, value, hint, prominent }) => (
          <Card key={label} className={cn("gap-2 py-4", prominent && "border-primary/40 bg-primary/5")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
              <CardDescription>{label}</CardDescription>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={cn("font-bold tracking-tight", prominent ? "text-3xl" : "text-2xl")}>
                {balanceLoading || value === undefined ? <Skeleton className="h-8 w-24" /> : value}
              </div>
              <p className="m-0 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Donate */}
        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandCoins className="size-5" />
              Donar a la tesorería
            </CardTitle>
            <CardDescription>Cualquiera puede añadir ETH a los fondos de la DAO.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {address === undefined ? (
              <p className="m-0 text-sm text-muted-foreground">Conecta tu wallet para donar.</p>
            ) : (
              <>
                <div className="relative">
                  <Input
                    inputMode="decimal"
                    placeholder="0.5"
                    className="pr-14"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={donating}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    ETH
                  </span>
                </div>
                {userBalance !== undefined && (
                  <p className={cn("m-0 text-xs text-muted-foreground", notEnoughBalance && "text-destructive")}>
                    {notEnoughBalance ? "Saldo insuficiente. " : ""}Tu saldo: {formatEther(userBalance.value)} ETH
                  </p>
                )}
                <Button className="w-full" disabled={donating || !amountValid} onClick={donate}>
                  {donating ? <Loader className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {isSending ? "Confirma en tu wallet..." : isConfirming ? "Confirmando..." : "Donar"}
                </Button>
                <p className="m-0 flex items-start gap-2 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  <span>
                    Lo que donas queda en la tesorería y solo puede salir con una propuesta aprobada. Pagarás la tarifa
                    de la red.
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent movements, with a sheet for the full list */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Últimos movimientos</CardTitle>
              <CardDescription>
                {movements.length === 0
                  ? "Todavía no hay movimientos"
                  : `Los ${Math.min(RECENT_MOVEMENTS, movements.length)} más recientes de ${movements.length}`}
              </CardDescription>
            </div>
            {movements.length > 0 && <MovementsSheet movements={movements} />}
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map(x => (
                  <Skeleton key={x} className="h-12" />
                ))}
              </div>
            ) : movements.length === 0 ? (
              <p className="m-0 py-6 text-center text-sm text-muted-foreground">
                Todavía no hay movimientos. Dona el primer ETH para empezar.
              </p>
            ) : (
              <ul className="m-0 list-none space-y-2 p-0">
                {recentMovements.map(movement => (
                  <MovementRow key={movement.key} movement={movement} />
                ))}
              </ul>
            )}
          </CardContent>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Dirección del contrato: <span className="font-mono">{shortAddress(treasuryAddress)}</span>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
