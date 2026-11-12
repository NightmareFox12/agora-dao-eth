"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useAccount, useAccountEffect } from "wagmi";
import { TaskCard } from "~~/app/task/_components/TaskCard";
import { ProposalCard } from "~~/app/vote/_components/ProposalCard";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";
import { Button } from "~~/components/ui/shadcn/button";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { TASK_STATUS } from "~~/lib/tasks";
import { PROPOSAL_STATUS, type ProposalData } from "~~/lib/votes";

const DAY = 86_400;
const now = Math.floor(Date.now() / 1000);

// Sample content, rendered with the same components the app uses, so the hero shows the real product.
const SAMPLE_PROPOSAL: ProposalData = {
  id: 12n,
  creator: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE",
  title: "Pagar 0.4 ETH al equipo que organizó el meetup de octubre",
  description: "",
  status: PROPOSAL_STATUS.Active,
  createdAt: BigInt(now - 2 * DAY),
  votingDeadline: BigInt(now + 5 * DAY),
  forVotes: 14n,
  againstVotes: 3n,
  abstainVotes: 2n,
  totalMembersAtCreation: 31n,
  action: { kind: 1, target: "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE", value: parseEther("0.4") },
};

export const HeroSection: React.FC = () => {
  const { status } = useAccount();
  const router = useRouter();

  // only for a fresh connection: the user may be reading further down and miss that the button changed
  useAccountEffect({
    onConnect({ isReconnected }) {
      if (isReconnected) return;

      toast.success("Wallet conectada", {
        description: "Ya puedes ver las DAOs disponibles.",
        duration: 15000,
        action: { label: "Ver las DAOs", onClick: () => router.push("/daos") },
      });
    },
  });

  return (
    <section className="container mx-auto grid items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
      <div className="max-w-xl space-y-6">
        <h1 className="m-0 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Reparte el trabajo de tu comunidad y págalo sin intermediarios.
        </h1>
        <p className="m-0 text-lg text-muted-foreground">
          Agora DAO es para grupos que publican tareas, votan decisiones y manejan un fondo común. La recompensa de cada
          tarea queda apartada al publicarla, cada voto se registra en la blockchain y el dinero del fondo solo sale
          cuando los miembros lo aprueban.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {status === "connecting" || status === "reconnecting" ? (
            <Skeleton className="h-10 w-44" />
          ) : status === "connected" ? (
            <Button asChild size="lg">
              <Link href="/daos">
                Ver las DAOs
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <RainbowKitCustomConnectButton />
          )}
          <p className="m-0 text-sm text-muted-foreground">Gratis. Solo pagas la tarifa de la red en cada acción.</p>
        </div>
      </div>

      {/* Two real cards from the app, with sample content */}
      <div className="relative mx-auto w-full max-w-md space-y-4 lg:max-w-none">
        <TaskCard
          title="Traducir la guía de bienvenida al inglés"
          summary="Unas 1.200 palabras. Entrega el enlace al documento y una nota con lo que cambiaste."
          categoryId={2}
          reward={parseEther("0.05")}
          status={TASK_STATUS.Submitted}
          deadline={BigInt(now + 3 * DAY)}
          workDays={7}
          creator="0x71C7656EC7ab88b098defB751B7401B5f6d8976F"
        />
        <div className="lg:ml-12">
          <ProposalCard proposal={SAMPLE_PROPOSAL} />
        </div>
      </div>
    </section>
  );
};
