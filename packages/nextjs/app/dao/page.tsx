"use client";

import { useEffect, useTransition } from "react";
import { Loader } from "lucide-react";
import type { NextPage } from "next";
import { useRouter } from "next-nprogress-bar";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useHeaderStore } from "~~/services/store/header.store";

const Home: NextPage = () => {
  // const { address: connectedAddress } = useAccount();
  const { setShowHeader } = useHeaderStore();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

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

  return <main></main>;
};

export default Home;
