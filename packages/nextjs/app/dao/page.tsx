"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { Bug, Loader, Search } from "lucide-react";
import type { NextPage } from "next";
import { useRouter } from "next-nprogress-bar";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useHeaderStore } from "~~/services/store/header.store.";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const { setShowHeader } = useHeaderStore();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  //effects
  useEffect(() => {
    setShowHeader(false);
    if (localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS) === null) {
      startTransition(() => {
        router.push("/daos");
      });
    } else {
      router.replace("/daos");
      router.push("/");
    }
  }, [router, setShowHeader]);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  return (
    <main>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">Welcome to</span>
            <span className="block text-4xl font-bold">Scaffold-ETH 2</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <p className="text-center text-lg">
            Get started by editing{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/nextjs/app/page.tsx
            </code>
          </p>
          <p className="text-center text-lg">
            Edit your smart contract{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              YourContract.sol
            </code>{" "}
            in{" "}
            <code className="italic bg-base-300 text-base font-bold max-w-full break-words break-all inline-block">
              packages/hardhat/contracts
            </code>
          </p>
        </div>

        <article className="grow bg-base-300 w-full px-8 py-8">
          <div className="flex justify-center items-center gap-12 flex-col w-full md:flex-row">
            <Card className="flex-1 w-full justify-center h-[250px]">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <Bug className="size-12" />
                </CardTitle>
                <CardDescription className="text-center">Tinker with your smart contract using the </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Link href="/debug" passHref className="underline">
                  Debug Contracts
                </Link>{" "}
              </CardContent>
            </Card>

            <Card className="flex-1 w-full justify-center h-[250px]">
              <CardHeader>
                <CardTitle className="flex justify-center">
                  <Search className="size-12" />
                </CardTitle>
                <CardDescription className="text-center">Explore your local transactions with the</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Link href="/blockexplorer" passHref className="underline">
                  Block Explorer
                </Link>
              </CardContent>
            </Card>
          </div>
        </article>
      </div>
    </main>
  );
};

export default Home;
