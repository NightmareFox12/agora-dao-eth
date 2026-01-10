"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

export const HeaderDaoList: React.FC = () => {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) return;

    router.push("/");
  }, [isConnected, router]);

  return (
    <header className="border-b bg-card">
      <div className="xl:container mx-auto px-6 py-1">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl text-center md:text-left font-bold text-balance">DAOs disponibles</h1>
            <p className="text-center md:text-left text-muted-foreground mt-2 ">
              Descubre y únete a las organizaciones autónomas descentralizadas
            </p>
          </div>
          <div className="flex gap-1 mb-2 justify-center md:mb-0 md:justify-start">
            <RainbowKitCustomConnectButton />
            <FaucetButton />
          </div>
        </div>
      </div>
    </header>
  );
};
