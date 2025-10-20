"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Funnel, Search } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import { Input } from "~~/components/ui/shadcn/input";

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
            <h1 className="text-3xl text-center md:text-left font-bold text-balance">Available DAOs</h1>
            <p className="text-center md:text-left text-muted-foreground mt-2 ">
              Discover and join decentralized autonomous organizations
            </p>
          </div>
          <div className="flex gap-4 mb-2 justify-center md:mb-0 md:justify-start">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar DAOs..." className="pl-10" />
            </div>
            <Button size="icon">
              <Funnel className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
