"use client";

import { DaoCard } from "./DaoCard";
import { Frown } from "lucide-react";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

export const DaoGrid: React.FC = () => {
  //smart contract
  const { data: daos, isLoading: daoLoading } = useScaffoldReadContract({
    contractName: "AgoraDaoFabric",
    functionName: "getPublicDaos",
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

  return (
    <section>
      {daos === undefined || daoLoading ? (
        <LoadingCards />
      ) : daos.length === 0 ? (
        <article className="h-96 mt-5 flex justify-center flex-col text-center py-12">
          <Frown className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-semibold mb-2">No DAOs are available</h3>
          <p className="text-muted-foreground">Please check back later to see new organizations available.</p>
        </article>
      ) : (
        <article className="container mx-auto px-4 py-8">
          {/* Main Content */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {daos.map(x => {
              return (
                <DaoCard
                  key={x.daoID}
                  daoID={x.daoID}
                  daoAddress={x.daoAddress}
                  name={x.name}
                  description={x.description}
                  category={x.category}
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
