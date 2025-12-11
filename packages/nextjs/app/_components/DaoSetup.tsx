"use client";

import React, { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useDaoStore } from "~~/services/store/dao.store";
import { useHeaderStore } from "~~/services/store/header.store";

export const DaoSetup: React.FC = () => {
  const { setShowHeader } = useHeaderStore();
  const { daoAddress, setDaoAddress } = useDaoStore();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  //effects
  useEffect(() => {
    const daoStoraged = localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS);

    if (daoStoraged === null) {
      setShowHeader(false);
      startTransition(() => {
        router.push("/daos");
      });
    } else {
      if (daoAddress === "") setDaoAddress(daoStoraged!);
      setShowHeader(true);
    }
  }, [router, setShowHeader, setDaoAddress, daoAddress]);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin" />
      </main>
    );
  }
};
