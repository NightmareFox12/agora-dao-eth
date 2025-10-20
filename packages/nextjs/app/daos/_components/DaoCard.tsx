"use client";

import React from "react";
import dynamic from "next/dynamic";
import { DaoDetailsDialog } from "./DaoDetailsDialog";
import { Image, Users } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "~~/components/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~~/components/ui/shadcn/card";
import { Skeleton } from "~~/components/ui/shadcn/skeleton";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

//dinamycs
const NoSSRBadge = dynamic(() => import("~~/components/ui/shadcn/badge").then(module => module.Badge), { ssr: false });

//constans
const darkCategoryColors = {
  defi: "bg-blue-900 text-blue-300",
  gaming: "bg-purple-900 text-purple-300",
  "Social Impact": "bg-green-900 text-green-300",
  service: "bg-orange-900 text-orange-300",
  energy: "bg-yellow-900 text-yellow-300",
  governance: "bg-pink-900 text-pink-300",
} as const;

const lightCategoryColors = {
  defi: "bg-blue-100 text-blue-800",
  gaming: "bg-purple-100 text-purple-800",
  "Social Impact": "bg-green-100 text-green-800",
  service: "bg-orange-100 text-orange-800",
  energy: "bg-yellow-100 text-yellow-800",
  governance: "bg-pink-100 text-pink-800",
} as const;

type DaoCardProps = {
  daoID: bigint;
  daoAddress: string;
  name: string;
  description: string;
  category: string;
  imageUri: string;
  creationDate: bigint;
};

export const DaoCard: React.FC<DaoCardProps> = ({
  daoID,
  daoAddress,
  name,
  description,
  category,
  imageUri,
  creationDate,
}) => {
  const { resolvedTheme } = useTheme();

  //consts
  const isDarkMode = (resolvedTheme ?? "light") === "dark";

  //smart contract
  const { writeContractAsync: writeAgoraDaoAsync } = useScaffoldWriteContract({
    contractName: "AgoraDao",
    contractAddress: daoAddress,
  });

  const { data: userCounter, isLoading: userCounterLoading } = useScaffoldReadContract({
    contractName: "AgoraDao",
    functionName: "userCounter",
    contractAddress: daoAddress,
  });

  //functions
  const handleJoinDao = async () => {
    try {
      await writeAgoraDaoAsync({
        functionName: "joinDao",
        // args: [],
      });
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              {imageUri.length > 4 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`https://ipfs.io/ipfs/${imageUri}`} alt={name} className="object-cover" />
              ) : (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image className="w-6 h-6" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                {userCounter === undefined || userCounterLoading ? (
                  <Skeleton className="h-5 w-5 bg-primary/50" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {userCounter} {parseInt(`${userCounter}`) > 1 ? "users" : "user"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <NoSSRBadge>#{daoID}</NoSSRBadge>
        </div>
        <NoSSRBadge
          variant="secondary"
          className={`w-fit ${
            isDarkMode
              ? darkCategoryColors[category.toLowerCase() as keyof typeof darkCategoryColors]
              : lightCategoryColors[category.toLowerCase() as keyof typeof lightCategoryColors]
          }`}
        >
          {category.toLowerCase()}
        </NoSSRBadge>
      </CardHeader>

      <CardContent className="flex-1">
        <CardDescription className="text-sm leading-relaxed break-all">
          {description.length > 100 ? description.slice(0, 100) + "..." : description}
        </CardDescription>
      </CardContent>

      <CardFooter>
        <div className="w-full flex items-center justify-between gap-1 md:gap-1.5">
          <Button onClick={handleJoinDao} className="flex-1 " size="sm">
            Unirse a la DAO
          </Button>
          <DaoDetailsDialog
            daoID={daoID}
            daoAddress={daoAddress}
            name={name}
            description={description}
            imageUri={imageUri}
            creationDate={creationDate}
          />
        </div>
      </CardFooter>
    </Card>
  );
};
