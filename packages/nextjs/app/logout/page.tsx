"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useDaoStore } from "~~/services/store/dao.store";
import { useHeaderStore } from "~~/services/store/header.store";

export default function Logout() {
  const router = useRouter();
  const { setShowHeader } = useHeaderStore();
  const { setDaoAddress } = useDaoStore();

  //effects
  useEffect(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS);
    setShowHeader(false);
    setDaoAddress("");
    router.push("/");
  }, [router, setDaoAddress, setShowHeader]);

  return (
    <div className="flex items-center justify-center h-screen">
      <h2 className="text-2xl font-bold">Cerrando sesión...</h2>
    </div>
  );
}
