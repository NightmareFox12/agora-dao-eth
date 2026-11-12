"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const HeaderDaoList: React.FC = () => {
  const { status } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // "reconnecting" happens on every page reload; only a real disconnect should leave
    if (status !== "disconnected") return;

    router.push("/");
  }, [status, router]);

  return (
    <header className="border-b bg-card">
      <div className="xl:container mx-auto px-6 py-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div data-tour="daos-title">
            <h1 className="m-0 text-2xl text-center md:text-left font-bold text-balance">Elige una DAO</h1>
            <p className="m-0 text-center md:text-left text-muted-foreground mt-1">
              Entra en una de las que ya eres miembro, únete a otra o crea la tuya.
            </p>
          </div>
          <div className="flex gap-1 justify-center md:justify-start">
            <RainbowKitCustomConnectButton />
            <FaucetButton />
          </div>
        </div>
      </div>
    </header>
  );
};
