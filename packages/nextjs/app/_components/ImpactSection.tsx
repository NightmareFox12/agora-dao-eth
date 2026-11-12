"use client";

import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

/** The two numbers the factory can vouch for. Nothing here is estimated. */
export const ImpactSection: React.FC = () => {
  const { data: daoCounter } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "getTotalDaoCount",
  });

  const { data: userCounter } = useScaffoldReadContract({
    contractName: "AgoraDaoFactory",
    functionName: "userCounter",
  });

  const numbers = [
    { value: daoCounter, label: "DAOs creadas en esta red" },
    { value: userCounter, label: "Miembros registrados" },
  ];

  return (
    <section id="impact" className="border-t">
      <div className="container mx-auto grid gap-10 px-4 py-16 md:grid-cols-2">
        {numbers.map(({ value, label }) => (
          <div key={label} className="border-l-2 border-foreground pl-6">
            {value === undefined ? (
              <Skeleton className="h-14 w-24" />
            ) : (
              <p className="m-0 text-5xl font-bold tabular-nums tracking-tight">{value.toString()}</p>
            )}
            <p className="m-0 mt-2 text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
