"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Coins, FileText, Loader, Rocket } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { MarkdownEditor } from "~~/components/MarkdownEditor";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~~/components/ui/shadcn/form";
import { Input } from "~~/components/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/shadcn/select";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useDaoRoles } from "~~/hooks/useDaoRoles";
import { useTreasuryAddress } from "~~/hooks/useTreasuryAddress";
import { useVotesAddress } from "~~/hooks/useVotesAddress";
import {
  PROPOSAL_DESCRIPTION_MAX_LENGTH,
  PROPOSAL_TITLE_MAX_LENGTH,
  ProposalFormSchema,
  type ProposalFormValues,
} from "~~/lib/schemes/vote.scheme";
import { cn } from "~~/lib/utils";

const VOTING_DAY_OPTIONS = [3, 5, 7, 10, 14];

const KINDS = [
  { value: "text", label: "De texto", description: "Deja constancia de la decisión", Icon: FileText },
  { value: "payout", label: "De pago", description: "Si se aprueba, paga ETH desde la tesorería", Icon: Coins },
] as const;

export const CreateProposalForm: React.FC = () => {
  const router = useRouter();
  const votesAddress = useVotesAddress();
  const treasuryAddress = useTreasuryAddress();
  const { canCreateProposals, isLoading: rolesLoading } = useDaoRoles();

  //states
  const [submitting, setSubmitting] = useState<boolean>(false);

  //smart contract
  const { data: treasuryBalance } = useScaffoldReadContract({
    contractName: "AgoraTreasury",
    functionName: "balance",
    contractAddress: treasuryAddress,
    query: { enabled: treasuryAddress !== undefined },
  });

  // Form
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(ProposalFormSchema),
    mode: "onChange",
    defaultValues: { kind: "text", title: "", description: "", votingDays: 7, recipient: "", amount: "" },
  });
  const kind = form.watch("kind");

  //effects
  // revalidate payout fields when they become relevant
  useEffect(() => {
    if (kind === "payout") form.trigger(["recipient", "amount"]);
  }, [kind, form]);

  //Smart contract
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "AgoraVotes",
    contractAddress: votesAddress,
  });

  const onSubmit = async (data: ProposalFormValues) => {
    if (votesAddress === undefined) return;

    setSubmitting(true);
    try {
      if (data.kind === "payout") {
        await writeContractAsync({
          functionName: "createPayoutProposal",
          args: [
            data.title,
            data.description,
            BigInt(data.votingDays),
            data.recipient as `0x${string}`,
            parseEther(data.amount ?? "0"),
          ],
        });
      } else {
        await writeContractAsync({
          functionName: "createProposal",
          args: [data.title, data.description, BigInt(data.votingDays)],
        });
      }

      toast.success("¡Propuesta publicada!");
      router.push("/vote");
    } catch (err) {
      console.error(err);
      // wallet errors are already shown by the transaction notifications
    } finally {
      setSubmitting(false);
    }
  };

  if (rolesLoading || votesAddress === undefined) {
    return (
      <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </main>
    );
  }

  if (!canCreateProposals) {
    return (
      <main className="container mx-auto flex flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="m-0 text-2xl font-bold">No puedes publicar propuestas</h1>
        <p className="m-0 max-w-md text-muted-foreground">
          Solo los gestores de propuestas y los administradores de la DAO pueden publicarlas. Pídele a un administrador
          que te asigne el rol.
        </p>
        <Button asChild>
          <Link href="/vote">Volver a las propuestas</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="space-y-1">
        <Link
          href="/vote"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a las propuestas
        </Link>
        <h1 className="m-0 text-3xl font-bold tracking-tight">Nueva propuesta</h1>
        <p className="m-0 text-muted-foreground">
          Explica claramente qué se decide y por qué. Lo que escribas se publica en la blockchain y no se podrá cambiar.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <fieldset disabled={submitting} className="m-0 space-y-4 border-0 p-0">
            {/* Kind selector */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de propuesta</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {KINDS.map(({ value, label, description, Icon }) => {
                          const isSelected = field.value === value;

                          return (
                            <button
                              key={value}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => field.onChange(value)}
                              className={cn(
                                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50 hover:bg-accent",
                              )}
                            >
                              <Icon className="mt-0.5 size-5 shrink-0" />
                              <div>
                                <p className="m-0 font-medium">{label}</p>
                                <p className="m-0 text-sm text-muted-foreground">{description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Payout fields */}
            {kind === "payout" && (
              <Card>
                <CardHeader>
                  <CardTitle>Pago</CardTitle>
                  <CardDescription>
                    Si la propuesta se aprueba, cualquiera puede ejecutarla y el pago sale al instante desde la
                    tesorería.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="recipient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Destinatario <span className="font-bold text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="0x..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Monto <span className="font-bold text-destructive">*</span>
                        </FormLabel>
                        <div className="relative sm:w-64">
                          <FormControl>
                            <Input inputMode="decimal" placeholder="0.5" className="pr-14" {...field} />
                          </FormControl>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            ETH
                          </span>
                        </div>
                        <FormDescription>
                          Saldo de la tesorería: {treasuryBalance !== undefined ? formatEther(treasuryBalance) : "..."}{" "}
                          ETH
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>La propuesta</CardTitle>
                <CardDescription>Un título claro ayuda a decidir sin tener que abrirla.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Título <span className="font-bold text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Organizar un meetup en noviembre" {...field} />
                      </FormControl>
                      <div className="flex w-full justify-between px-1">
                        {fieldState.error === undefined && <span />}
                        <FormMessage className="-my-1" />
                        <FormDescription className="-my-1">
                          {field.value.length}/{PROPOSAL_TITLE_MAX_LENGTH}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>
                        Descripción <span className="font-bold text-destructive">*</span>
                      </FormLabel>
                      <MarkdownEditor
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        inputRef={field.ref}
                        invalid={fieldState.error !== undefined}
                        placeholder={
                          "Explica qué se decide, por qué, y qué pasa si se aprueba.\n\nPuedes dar formato con la barra de arriba, o escribiendo Markdown."
                        }
                      />
                      <div className="flex w-full justify-between px-1">
                        {fieldState.error === undefined && <span />}
                        <FormMessage className="-my-1" />
                        <FormDescription className="-my-1">
                          {field.value.length}/{PROPOSAL_DESCRIPTION_MAX_LENGTH}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Votación</CardTitle>
                <CardDescription>
                  Para aprobarse, debe votar al menos el 20% de los miembros y ganar «a favor» por mayoría.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="votingDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Días para votar</FormLabel>
                      <Select value={field.value.toString()} onValueChange={value => field.onChange(Number(value))}>
                        <FormControl>
                          <SelectTrigger className="w-full sm:w-64">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VOTING_DAY_OPTIONS.map(days => (
                            <SelectItem key={days} value={days.toString()}>
                              {days} días
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Después de este tiempo, cualquiera puede cerrar la votación.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button asChild variant="outline" type="button">
                <Link href="/vote">Cancelar</Link>
              </Button>
              <Button type="submit" size="lg" disabled={submitting || !form.formState.isValid}>
                {submitting ? <Loader className="size-4 animate-spin" /> : <Rocket className="size-4" />}
                {submitting ? "Confirma en tu wallet..." : "Publicar propuesta"}
              </Button>
            </div>
          </fieldset>
        </form>
      </Form>
    </main>
  );
};
