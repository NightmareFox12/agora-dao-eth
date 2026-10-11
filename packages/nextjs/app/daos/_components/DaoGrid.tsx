"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DaoCard } from "./DaoCard";
import { Frown, Loader, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/shadcn/button";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { LOCAL_STORAGE_KEYS } from "~~/constants/localStorage";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useDaoStore } from "~~/services/store/dao.store";

export const DaoGrid: React.FC = () => {
  const { selectedDao, clearDaoSearch } = useDaoStore();
  const { address } = useAccount();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  //smart contract
  const { data: daos, isLoading: daoLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaos",
  });

  const { data: daoCategories } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getAllDaoCategories",
  });

  //functions
  const getDaoCategories = (ids: readonly bigint[]) =>
    ids.flatMap(id => {
      const name = daoCategories?.[Number(id)];
      return name === undefined ? [] : [{ id: Number(id), name }];
    });

  //components
  const LoadingCards = () => {
    const arr = new Array(9).fill(0);

    return (
      <article className="w-full grid gap-6 sm:grid-cols-2 md:grid-cols-3 px-4 sm:mt-4 mb-2 sm:mb-4">
        {arr.map((_x, y) => (
          <Skeleton key={y} className="h-56 w-full bg-primary/50" />
        ))}
      </article>
    );
  };

  useEffect(() => {
    const daoAddress = localStorage.getItem(LOCAL_STORAGE_KEYS.DAO_ADDRESS);
    if (daoAddress !== null) {
      startTransition(() => {
        router.push(`/dao?address=${daoAddress}`);
      });
    }
  }, [router, startTransition]);

  //memos
  const daosFiltered = useMemo(() => {
    const search = selectedDao.name.trim().toLowerCase();

    return daos?.filter(x => {
      if (selectedDao.onlyMine && x.creator !== address) return false;
      if (selectedDao.categories.length > 0 && !x.categoryIDs.some(id => selectedDao.categories.includes(Number(id))))
        return false;
      if (search.length > 0 && !x.name.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [address, daos, selectedDao]);

  if (isPending) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin" />
      </main>
    );
  }

  return (
    <section>
      {daos === undefined || daoLoading ? (
        <LoadingCards />
      ) : daos.length === 0 ? (
        <article className="h-96 mt-5 flex justify-center flex-col text-center py-12">
          <Frown className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">No hay DAOS disponibles</h3>
          <p className="text-muted-foreground">Por favor, vuelve más tarde para ver nuevas DAOS disponibles.</p>
        </article>
      ) : daosFiltered?.length === 0 ? (
        <article className="h-96 mt-5 flex justify-center items-center flex-col text-center py-12">
          <Frown className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">Ninguna DAO coincide</h3>
          <p className="text-muted-foreground mb-4">Prueba con otra búsqueda o quita algunos filtros.</p>
          <Button variant="outline" onClick={clearDaoSearch}>
            <X className="h-4 w-4" />
            Borrar búsqueda y filtros
          </Button>
        </article>
      ) : (
        <article className="container mx-auto px-4 py-8">
          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {daosFiltered?.map(x => {
              return (
                <DaoCard
                  key={x.daoID}
                  daoID={x.daoID}
                  daoAddress={x.daoAddress}
                  userAddress={address}
                  creator={x.creator}
                  name={x.name}
                  description={x.description}
                  categories={getDaoCategories(x.categoryIDs)}
                  imageUri={x.imageURI}
                  creationDate={x.creationTimestamp}
                />
              );
            })}
          </div>
        </article>
      )}
    </section>
  );
};
