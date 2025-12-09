"use client";

import { useEffect, useTransition } from "react";
import { Loader } from "lucide-react";
import type { NextPage } from "next";
import { useRouter } from "next-nprogress-bar";
import { useAccount } from "wagmi";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useDaoStore } from "~~/services/store/dao.store";
import { useHeaderStore } from "~~/services/store/header.store";

const Home: NextPage = () => {
  const { address: userAddress } = useAccount();
  const { setShowHeader } = useHeaderStore();
  const { daoAddress, setDaoAddress } = useDaoStore();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  //smart contract
  const { data: DEFAULT_ADMIN_ROLE } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "DEFAULT_ADMIN_ROLE",
    contractAddress: daoAddress,
  });
  const { data: owner } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "isRole",
    contractAddress: daoAddress,
    args: [DEFAULT_ADMIN_ROLE, userAddress],
  });

  //effects
  useEffect(() => {
    if (localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS) === null) {
      setShowHeader(false);
      startTransition(() => {
        router.push("/daos");
      });
    } else {
      setDaoAddress(localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS)!);
    }
    setShowHeader(true);
  }, [router, setShowHeader, setDaoAddress]);

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
