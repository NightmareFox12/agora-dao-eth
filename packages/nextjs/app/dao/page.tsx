"use client";

import { useEffect, useTransition } from "react";
import { Loader } from "lucide-react";
import type { NextPage } from "next";
import { useRouter } from "next-nprogress-bar";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useHeaderStore } from "~~/services/store/header.store";

const Home: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  const { setShowHeader } = useHeaderStore();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  //smart contract
  const { data: DEFAULT_ADMIN_ROLE } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "DEFAULT_ADMIN_ROLE",
    contractAddress: localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS)!,
  });
  const { data: owner } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    contractAddress: localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS)!,
    args: [DEFAULT_ADMIN_ROLE, localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS)!],
  });

  //effects
  useEffect(() => {
    if (localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS) === null) {
      setShowHeader(false);
      startTransition(() => {
        router.push("/daos");
      });
    }
    setShowHeader(true);
  }, [router, setShowHeader]);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  return <main>{owner?.toString()}</main>;
};

export default Home;
